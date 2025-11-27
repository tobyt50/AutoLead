import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { query } from './db';
import logger from './logger';
import { sendEmail } from './outreach'; // Import the email logic

const app = express();

app.use(cors());
app.use(express.json());
// Serve static files (The UI)
app.use(express.static(path.join(__dirname, '../public')));

// 1. Get Leads
app.get('/api/leads', async (req: Request, res: Response) => {
  try {
    const result = await query(`SELECT * FROM leads ORDER BY found_at DESC LIMIT 100`);
    res.json(result.rows);
  } catch (err) {
    logger.error('API Error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Send Email & Update Status
app.post('/api/leads/:id/email', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // 1. Get lead details
    const leadRes = await query('SELECT * FROM leads WHERE id = $1', [id]);
    if (leadRes.rows.length === 0) {
       res.status(404).json({ error: 'Lead not found' });
       return;
    }
    const lead = leadRes.rows[0];

    // 2. Send Email (Mock or Real)
    // Note: We need an email address. Google Places often doesn't give emails.
    // If we don't have an email, we can't send one.
    // For this demo, we will simulate success or check if you have an email column filled.
    
    // REAL WORLD CHECK:
    // Google Places API rarely provides public email addresses directly. 
    // Usually, you have to visit their website to find it. 
    // Since these leads *don't* have websites, you usually have to call them.
    
    // HOWEVER, if you had an email, it would look like this:
    // const sent = await sendEmail('test@example.com', lead.name); 
    
    // For now, we will mark it as CONTACTED to show the UI update.
    await query(
      `UPDATE leads SET status = 'CONTACTED', last_contacted_at = now(), contact_attempts = contact_attempts + 1 WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Status updated to CONTACTED (Email simulation)' });

  } catch (err) {
    logger.error(`Error processing lead ${id}`, err);
    res.status(500).json({ error: 'Failed to process' });
  }
});

export default app;