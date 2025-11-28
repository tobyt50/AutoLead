import dotenv from 'dotenv';
dotenv.config();

import app from './api';
import { startScheduler } from './scheduler';
import logger from './logger';
import pool from './db';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

startScheduler();

const shutdown = async () => {
  logger.info('Shutting down...');
  server.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);