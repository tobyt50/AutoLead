// src/scripts/manual-run.ts
import dotenv from 'dotenv';
dotenv.config();
import { searchNearby, getPlaceDetails, saveLead } from '../places';
import logger from '../logger';
import pool from '../db';
import pLimit from 'p-limit';

const limit = pLimit(2);

(async () => {
  logger.info('--- Starting Manual Run ---');
  try {
    const lat = Number(process.env.SEARCH_CITY_LAT);
    const lng = Number(process.env.SEARCH_CITY_LNG);
    const keyword = process.env.SEARCH_KEYWORD || 'restaurant';
    
    const places = await searchNearby(lat, lng, 2000, keyword); // Smaller radius for testing
    logger.info(`Found ${places.length} places.`);

    const tasks = places.map(place => limit(async () => {
      const details = await getPlaceDetails(place.place_id);
      if (details) {
        details.place_id = details.place_id || place.place_id;
        await saveLead(details);
      }
    }));

    await Promise.all(tasks);
    logger.info('Manual run finished.');
  } catch (e) {
    logger.error(e);
  } finally {
    await pool.end();
  }
})();