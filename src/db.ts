import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10, // Max clients in the pool
  idleTimeoutMillis: 30000
});

pool.on('connect', () => {
  logger.debug('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query: "${text}"`, { duration, rows: res.rowCount });
    return res;
  } catch (err) {
    logger.error(`Query Error: "${text}"`, err);
    throw err;
  }
};

export default pool;