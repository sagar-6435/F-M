import dotenv from 'dotenv';
dotenv.config();

const CHATMITRA_API_URL = process.env.CHATMITRA_API_URL;
const CHATMITRA_API_KEY = process.env.CHATMITRA_API_KEY;
const CHATMITRA_AUTH_TOKEN = process.env.CHATMITRA_AUTH_TOKEN;
const CHATMITRA_SENDER_ID = process.env.CHATMITRA_SENDER_ID; // optional sender
const ADMIN_PHONE_1 = process.env.ADMIN_PHONE_1;
const ADMIN_PHONE_2 = process.env.ADMIN_PHONE_2;

const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

/**
 * Send an SMS to the relevant branch admin when a booking is paid using ChatMitra.
 * Falls back to no-op with a warning when ChatMitra is not configured.
 * @param {Object} booking - The confirmed booking document
 */
export const sendAdminSmsNotification = async (booking) => {
  if (!CHATMITRA_API_URL) {
    console.warn('⚠️  ChatMitra API not configured. Skipping SMS notification.');
    return;
  }

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

  const message = `🌟 NEW BOOKING CONFIRMED!\nBranch: ${branchName}\nID: ${booking.id}\nUser: ${booking.name} (${booking.phone})\nService: ${booking.service}\nDate: ${booking.date}\nTime: ${booking.timeSlot} (${booking.duration}hr)\nTotal: ₹${booking.totalPrice}\nPayment: ${paymentInfo}\nOccasion: ${occasion}`;

  const recipient = normalizePhoneNumber(adminPhone);
  if (!recipient) {
    console.warn(`⚠️  Invalid admin phone for branch: ${booking.branch}. Skipping SMS.`);
    return;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (CHATMITRA_API_KEY) headers['x-api-key'] = CHATMITRA_API_KEY;
  if (CHATMITRA_AUTH_TOKEN) headers.Authorization = `Bearer ${CHATMITRA_AUTH_TOKEN}`;

  try {
    const res = await fetch(CHATMITRA_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: recipient,
        message,
        channel: 'sms',
        from: CHATMITRA_SENDER_ID || undefined,
      }),
    });

    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      throw new Error(body?.message || body?.error || `ChatMitra SMS failed with status ${res.status}`);
    }

    console.log(`✅ Admin SMS sent to ${adminPhone}`);
    return body;
  } catch (error) {
    console.error(`✗ Failed to send admin SMS to ${adminPhone}:`, error?.message || error);
  }
};
