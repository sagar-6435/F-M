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
 * Message is kept under 160 chars for Twilio trial account compatibility.
 * Upgrade to paid Twilio account for longer multi-line messages.
 * @param {Object} booking - The confirmed booking document
 */
export const sendAdminSmsNotification = async (booking) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn('⚠️  Twilio credentials not configured. Skipping SMS notification.');
    return;
  }

  const adminPhone = booking.branch === 'branch-2' ? ADMIN_PHONE_2 : ADMIN_PHONE_1;

  if (!adminPhone) {
    console.warn(`⚠️  No admin phone configured for branch: ${booking.branch}. Skipping SMS.`);
    return;
  }

  const branch  = booking.branch === 'branch-2' ? 'Bhimavaram' : 'Eluru';
  const cake    = booking.cakeRequired && booking.selectedCake ? booking.selectedCake.name : 'None';
  const extras  = booking.extraDecorations?.length > 0 ? booking.extraDecorations.map(d => d.name).join(',') : 'None';
  const occasion = booking.occasion === 'Other' && booking.customOccasion ? booking.customOccasion : (booking.occasion || '');
  const paid    = booking.amountPaid || 0;
  const bal     = booking.balanceAmount || 0;

  // Compact single-segment SMS (< 160 chars)
  const message = `F&M ${branch} BOOKING! ${booking.name} ${booking.phone} | ${booking.date} ${booking.timeSlot} ${booking.duration}hr ${booking.membersCount}pax | ${occasion} Cake:${cake} | Paid:Rs${paid} Bal:Rs${bal}`;

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
    // Don't throw — SMS failure must never block booking confirmation
  }
};
