import axios from 'axios';
import axiosRetry from 'axios-retry';
import { query } from './db';
import { GooglePlaceResult, GoogleSearchResponse, Lead } from './types';
import logger from './logger';

const apiKey = process.env.GOOGLE_API_KEY;

// Auto-retry requests on 429 (Rate Limit) or 5xx errors
axiosRetry(axios, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  }
});

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function searchNearby(lat: number, lng: number, radius: number, type: string): Promise<GooglePlaceResult[]> {
  const results: GooglePlaceResult[] = [];
  let nextToken = '';
  
  try {
    do {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}${nextToken ? `&pagetoken=${nextToken}` : ''}`;
      
      const { data } = await axios.get<GoogleSearchResponse>(url);
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        logger.error(`Google API Error: ${data.status}`);
        break;
      }

      if (data.results) results.push(...data.results);

      nextToken = data.next_page_token || '';

      // Google requires a short delay before the next_page_token is valid
      if (nextToken) await sleep(2000); 

    } while (nextToken);
    
  } catch (error) {
    logger.error('Error in searchNearby', error);
  }

  return results;
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
  try {
    const fields = 'name,formatted_address,geometry,formatted_phone_number,website,url,types,rating,user_ratings_total';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    const { data } = await axios.get(url);
    return data.result;
  } catch (error) {
    logger.error(`Error getting details for ${placeId}`, error);
    return null;
  }
}

export async function saveLead(detail: GooglePlaceResult) {
  // Logic: Only save if website is missing (our target demographic)
  if (detail.website) {
    logger.info(`Skipping ${detail.name} (Has website)`);
    return;
  }

  const sql = `
    INSERT INTO leads (
      place_id, name, address, lat, lng, phone, 
      google_url, category, rating, user_ratings_total, raw_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (place_id) DO NOTHING
    RETURNING id;
  `;

  const params = [
    detail.place_id,
    detail.name,
    detail.formatted_address,
    detail.geometry?.location.lat,
    detail.geometry?.location.lng,
    detail.formatted_phone_number,
    detail.url,
    (detail.types || [])[0],
    detail.rating,
    detail.user_ratings_total,
    JSON.stringify(detail)
  ];

  try {
    const res = await query(sql, params);
    if (res.rowCount && res.rowCount > 0) {
      logger.info(`Saved new lead: ${detail.name}`);
    } else {
      logger.debug(`Duplicate lead skipped: ${detail.name}`);
    }
  } catch (err) {
    logger.error('DB Insert Error', err);
  }
}