import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const message = await client.messages.create({
  body: 'F&M: Twilio SMS is working! Admin booking alerts are active.',
  from: process.env.TWILIO_FROM_NUMBER,
  to: '+916281762014',
});

console.log('SMS sent! SID:', message.sid, '| Status:', message.status);
