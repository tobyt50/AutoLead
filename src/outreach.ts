import mailgun from 'mailgun-js';
import logger from './logger';

const mg = mailgun({ 
  apiKey: process.env.MAILGUN_API_KEY || '', 
  domain: process.env.MAILGUN_DOMAIN || '' 
});

export async function sendEmail(to: string, businessName: string): Promise<boolean> {
  const data = {
    from: process.env.FROM_EMAIL,
    to,
    subject: `Quick question about ${businessName}`,
    text: `Hi,\n\nI couldn't find a website for ${businessName} on Google Maps. Are you currently accepting new customers online?\n\nBest,\n[Your Name]`
  };

  try {
    await mg.messages().send(data);
    logger.info(`Email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
    return false;
  }
}