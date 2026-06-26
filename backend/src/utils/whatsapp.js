import dotenv from 'dotenv';
dotenv.config();

const CHATMITRA_API_URL  = process.env.CHATMITRA_API_URL;
const CHATMITRA_API_KEY  = process.env.CHATMITRA_API_KEY;
const CHATMITRA_AUTH_TOKEN = process.env.CHATMITRA_AUTH_TOKEN;

const ADMIN_PHONE_1 = process.env.ADMIN_PHONE_1; // e.g. +917680006662
const ADMIN_PHONE_2 = process.env.ADMIN_PHONE_2;

/**
 * Normalize a phone number to 10-digit Indian format (no country code, no spaces)
 * ChatMitra expects numbers without + or country code for Indian numbers.
 */
const normalizePhone = (phone = '') => {
  const digits = phone.replace(/\D/g, ''); // strip non-digits
  if (digits.startsWith('91') && digits.length === 12) return digits.slice(2); // 91XXXXXXXXXX → XXXXXXXXXX
  if (digits.length === 10) return digits;
  return digits;
};

/**
 * Send a single WhatsApp message via ChatMitra API
 * @param {string} phone - recipient phone (any format)
 * @param {string} message - plain text message body
 */
const sendWhatsAppMessage = async (phone, message) => {
  if (!CHATMITRA_API_URL || !CHATMITRA_API_KEY || !CHATMITRA_AUTH_TOKEN) {
    console.warn('⚠️  ChatMitra credentials not configured. Skipping WhatsApp notification.');
    return;
  }

  const normalizedPhone = normalizePhone(phone);

  const payload = {
    api_key: CHATMITRA_API_KEY,
    phone_number: normalizedPhone,
    message,
  };

  const response = await fetch(CHATMITRA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHATMITRA_AUTH_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`ChatMitra API error ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log(`✅ WhatsApp sent to ${normalizedPhone}:`, data);
  return data;
};

/**
 * Build the customer confirmation message
 */
const buildCustomerMessage = (booking) => {
  const branchName = booking.branch === 'branch-2' ? 'Bhimavaram' : 'Eluru';
  const occasion = booking.occasion === 'Other' && booking.customOccasion
    ? booking.customOccasion
    : (booking.occasion || 'Celebration');

  const paymentInfo = booking.paymentType === 'advance'
    ? `Advance Paid: ₹${booking.amountPaid}\nBalance at Venue: ₹${booking.balanceAmount}`
    : `Amount Paid: ₹${booking.amountPaid}`;

  return `🎉 Booking Confirmed! — Friends & Memories

Hi ${booking.name},

Your booking is confirmed ✅

📍 Branch: ${branchName}
🎭 Service: ${booking.service}
📅 Date: ${booking.date}
🕐 Time: ${booking.timeSlot} (${booking.duration} hr)
🎊 Occasion: ${occasion}
👥 Members: ${booking.membersCount || 1}
💰 Total: ₹${booking.totalPrice}
${paymentInfo}
🆔 Booking ID: ${booking.id}

For queries, contact us on WhatsApp.
Thank you for choosing Friends & Memories! 🌟`;
};

/**
 * Build the admin notification message
 */
const buildAdminMessage = (booking) => {
  const branchName = booking.branch === 'branch-2' ? 'Bhimavaram' : 'Eluru';
  const occasion = booking.occasion === 'Other' && booking.customOccasion
    ? booking.customOccasion
    : (booking.occasion || 'N/A');

  const paymentInfo = booking.paymentType === 'advance'
    ? `ADVANCE | Paid: ₹${booking.amountPaid} | Bal: ₹${booking.balanceAmount}`
    : `FULL | Paid: ₹${booking.amountPaid}`;

  return `🔔 NEW BOOKING — ${branchName}

ID: ${booking.id}
Customer: ${booking.name} (${booking.phone})
Date: ${booking.date}
Time: ${booking.timeSlot} (${booking.duration}hr)
Service: ${booking.service}
Occasion: ${occasion}
Members: ${booking.membersCount || 1}
Total: ₹${booking.totalPrice}
Payment: ${paymentInfo}`;
};

/**
 * Send WhatsApp notifications to both customer and branch admin on booking success.
 * Fires silently — errors are logged but never crash the booking flow.
 */
export const sendBookingWhatsAppNotifications = async (booking) => {
  if (!CHATMITRA_API_URL || !CHATMITRA_API_KEY || !CHATMITRA_AUTH_TOKEN) {
    console.warn('⚠️  ChatMitra not configured — skipping WhatsApp notifications.');
    return;
  }

  const adminPhone = booking.branch === 'branch-2' ? ADMIN_PHONE_2 : ADMIN_PHONE_1;

  const results = await Promise.allSettled([
    // 1. Customer confirmation
    booking.phone
      ? sendWhatsAppMessage(booking.phone, buildCustomerMessage(booking))
      : Promise.resolve(),

    // 2. Admin notification
    adminPhone
      ? sendWhatsAppMessage(adminPhone, buildAdminMessage(booking))
      : Promise.resolve(),
  ]);

  results.forEach((result, i) => {
    const target = i === 0 ? 'customer' : 'admin';
    if (result.status === 'rejected') {
      console.error(`✗ WhatsApp ${target} notification failed:`, result.reason?.message);
    }
  });
};
