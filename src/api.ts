import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { query } from './db';
import logger from './logger';
// import { sendEmail } from './outreach'; // Uncomment when ready to use Mailgun

const app = express();

// --- CORS CONFIGURATION ---
const allowedOrigins = [
  'https://autoleadgen.vercel.app', // Your Vercel Frontend
  'http://localhost:3000',          // Local testing
  'http://127.0.0.1:5500'           // Common local HTML server ports
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
// --------------------------

app.use(express.json());

// Serve static files (Optional: mostly for local testing now that you use Vercel)
app.use(express.static(path.join(__dirname, '../public')));

// 1. Health Check (Keep Render awake)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 2. Get Leads
app.get('/api/leads', async (req: Request, res: Response) => {
  try {
    const result = await query(`SELECT * FROM leads ORDER BY found_at DESC LIMIT 100`);
    res.json(result.rows);
  } catch (err) {
    logger.error('API Error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Send Email & Update Status
app.post('/api/leads/:id/email', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Check if lead exists
    const leadRes = await query('SELECT * FROM leads WHERE id = $1', [id]);
    if (leadRes.rows.length === 0) {
       res.status(404).json({ error: 'Lead not found' });
       return;
    }

    // Logic: Mark as Contacted
    await query(
      `UPDATE leads SET status = 'CONTACTED', last_contacted_at = now(), contact_attempts = contact_attempts + 1 WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Status updated to CONTACTED' });

  } catch (err) {
    logger.error(`Error processing lead ${id}`, err);
    res.status(500).json({ error: 'Failed to process' });
  }
});

export default app;