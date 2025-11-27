import dotenv from 'dotenv';
dotenv.config();

import app from './api';
import { startScheduler } from './scheduler';
import logger from './logger';
import pool from './db';

const PORT = process.env.PORT || 3000;

// 1. Start the Admin API
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// 2. Start the Background Worker (Cron)
startScheduler();

// 3. Graceful Shutdown
const shutdown = async () => {
  logger.info('Shutting down...');
  server.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);