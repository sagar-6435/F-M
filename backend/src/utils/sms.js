import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const ADMIN_PHONE_1      = process.env.ADMIN_PHONE_1;
const ADMIN_PHONE_2      = process.env.ADMIN_PHONE_2;

/**
 * Send an SMS to the relevant branch admin when a booking is paid.
 * @param {Object} booking - The confirmed booking document
 */
export const sendAdminSmsNotification = async (booking) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn('⚠️  Twilio credentials not configured. Skipping SMS notification.');
    return;
  }

  // Prefer ADMIN_PHONE_1/2 from .env, or can be extended to fetch from DB
  const adminPhone = booking.branch === 'branch-2' ? ADMIN_PHONE_2 : ADMIN_PHONE_1;

  if (!adminPhone) {
    console.warn(`⚠️  No admin phone configured for branch: ${booking.branch}. Skipping SMS.`);
    return;
  }

  const branchName = booking.branch === 'branch-2' ? 'Bhimavaram' : 'Eluru';
  const occasion = booking.occasion === 'Other' && booking.customOccasion ? booking.customOccasion : (booking.occasion || 'N/A');
  const paymentInfo = booking.paymentType === 'advance' 
    ? `ADVANCE (Paid: ₹${booking.amountPaid}, Bal: ₹${booking.balanceAmount})`
    : `FULL PAYMENT (Paid: ₹${booking.amountPaid})`;

  // More descriptive message
  const message = `
🌟 NEW BOOKING CONFIRMED!
Branch: ${branchName}
ID: ${booking.id}
User: ${booking.name} (${booking.phone})
Service: ${booking.service}
Date: ${booking.date}
Time: ${booking.timeSlot} (${booking.duration}hr)
Total: ₹${booking.totalPrice}
Payment: ${paymentInfo}
Occasion: ${occasion}
  `.trim();

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      body: message,
      from: TWILIO_FROM_NUMBER,
      to: adminPhone,
    });
    console.log(`✅ Admin SMS sent to ${adminPhone} | SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`✗ Failed to send admin SMS to ${adminPhone}:`, error.message);
  }
};
