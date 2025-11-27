import cron from 'node-cron';
import pLimit from 'p-limit';
import { searchNearby, getPlaceDetails, saveLead } from './places';
import logger from './logger';

// Concurrency limit: Only process 2 details calls at once to stay under Google QPS limits
const limit = pLimit(2);

export function startScheduler() {
  const schedule = '*/30 * * * *'; // Every 30 minutes
  logger.info(`Scheduler started with pattern: ${schedule}`);

  cron.schedule(schedule, async () => {
    logger.info('Starting scheduled search job...');
    
    const lat = Number(process.env.SEARCH_CITY_LAT);
    const lng = Number(process.env.SEARCH_CITY_LNG);
    const radius = Number(process.env.SEARCH_RADIUS_METERS) || 5000;
    const keyword = process.env.SEARCH_KEYWORD || 'restaurant';

    try {
      // 1. Find Places
      const places = await searchNearby(lat, lng, radius, keyword);
      logger.info(`Found ${places.length} potential locations.`);

      // 2. Process details in parallel (with limit)
      const tasks = places.map(place => {
        return limit(async () => {
          const details = await getPlaceDetails(place.place_id);
          if (details) {
            // Merge the place_id from search result if missing in details
            details.place_id = details.place_id || place.place_id;
            await saveLead(details);
          }
        });
      });

      await Promise.all(tasks);
      logger.info('Scheduled job completed.');

    } catch (error) {
      logger.error('Scheduled job failed', error);
    }
  });
}