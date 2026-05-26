import dotenv from 'dotenv';
import { getCatalogForBranch } from '../controllers/catalogController.js';
import { getBranchName } from './branchConfig.js';

dotenv.config();

const CHATMITRA_API_URL = process.env.CHATMITRA_API_URL;
const CHATMITRA_API_KEY = process.env.CHATMITRA_API_KEY;
const CHATMITRA_AUTH_TOKEN = process.env.CHATMITRA_AUTH_TOKEN;
const ADMIN_PHONE_1 = process.env.ADMIN_PHONE_1;
const ADMIN_PHONE_2 = process.env.ADMIN_PHONE_2;

const normalizePhoneNumber = (phone) => {
  if (!phone) return '';

  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('91') && digits.length >= 12) {
    return digits;
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
};

const formatBranchDisplayName = (branchId) => getBranchName(branchId) || branchId || 'Branch';

const getPaymentSummary = (booking) => {
  if (booking.paymentStatus === 'partially-paid') {
    return `ADVANCE payment received. Paid: ₹${booking.amountPaid || 0}, Balance: ₹${booking.balanceAmount || 0}`;
  }

  if (booking.paymentStatus === 'paid') {
    return `FULL payment received. Paid: ₹${booking.amountPaid || booking.totalPrice || 0}`;
  }

  return `Payment status: ${booking.paymentStatus || 'pending'}`;
};

const buildBookingSummary = (booking) => {
  const occasion = booking.occasion === 'Other' && booking.customOccasion
    ? booking.customOccasion
    : (booking.occasion || 'N/A');
  const selectedCake = booking.selectedCake?.name || 'None';
  const extraDecorations = Array.isArray(booking.extraDecorations) && booking.extraDecorations.length
    ? booking.extraDecorations.map((item) => item?.name).filter(Boolean).join(', ')
    : 'None';

  return [
    `Booking ID: ${booking.id}`,
    `Customer: ${booking.name || 'N/A'} (${booking.phone || 'N/A'})`,
    `Branch: ${formatBranchDisplayName(booking.branch)}`,
    `Service: ${booking.service || 'N/A'}`,
    `Date: ${booking.date || 'N/A'}`,
    `Time: ${booking.timeSlot || 'N/A'} (${booking.duration || 'N/A'} hr)`,
    `Members: ${booking.membersCount ?? 'N/A'}`,
    `Total: ₹${booking.totalPrice ?? 0}`,
    `Payment: ${getPaymentSummary(booking)}`,
    `Occasion: ${occasion}`,
    `Cake: ${selectedCake}`,
    `Decorations: ${extraDecorations}`,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ].filter(Boolean).join('\n');
};

const buildCustomerMessage = (booking) => {
  const branchName = formatBranchDisplayName(booking.branch);
  const paymentText = booking.paymentStatus === 'paid'
    ? 'Your payment has been confirmed.'
    : booking.paymentStatus === 'partially-paid'
      ? 'Your advance payment has been confirmed.'
      : 'Your booking has been confirmed.';

  return [
    `Hi ${booking.name || 'Customer'},`,
    paymentText,
    '',
    buildBookingSummary(booking),
    '',
    `Branch contact: ${booking.branchContact || 'N/A'}`,
  ].join('\n');
};

const buildAdminMessage = (booking) => {
  return [
    'New booking/payment update received.',
    '',
    buildBookingSummary(booking),
  ].join('\n');
};

const sendChatMitraMessage = async ({ to, message }) => {
  const recipient = normalizePhoneNumber(to);

  if (!recipient) {
    console.warn('⚠️  WhatsApp recipient number missing. Skipping Chat Mitra notification.');
    return null;
  }

  if (!CHATMITRA_API_URL) {
    console.warn('⚠️  CHATMITRA_API_URL is not configured. Skipping WhatsApp notification.');
    return null;
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (CHATMITRA_API_KEY) {
    headers['x-api-key'] = CHATMITRA_API_KEY;
  }

  if (CHATMITRA_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${CHATMITRA_AUTH_TOKEN}`;
  }

  const response = await fetch(CHATMITRA_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to: recipient,
      message,
      channel: 'whatsapp',
    }),
  });

  const responseText = await response.text();
  let responseBody = null;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = responseText;
  }

  if (!response.ok) {
    throw new Error(
      responseBody?.message || responseBody?.error || `Chat Mitra request failed with status ${response.status}`
    );
  }

  return responseBody;
};

const resolveBranchAdminWhatsApp = (branchId) => {
  const branchAdminPhone = branchId === 'branch-2' ? ADMIN_PHONE_2 : ADMIN_PHONE_1;

  if (!branchAdminPhone) {
    return null;
  }

  return {
    branchName: formatBranchDisplayName(branchId),
    adminWhatsApp: normalizePhoneNumber(branchAdminPhone),
    branchContact: branchAdminPhone,
  };
};

const resolveBranchContact = async (branchId) => {
  const catalog = await getCatalogForBranch(branchId);
  const branchPhone = catalog?.socialLinks?.whatsapp || catalog?.phone || '';

  return {
    branchName: formatBranchDisplayName(branchId),
    branchContact: branchPhone,
  };
};

export const sendBookingWhatsAppNotifications = async (booking) => {
  const branchContext = await resolveBranchContact(booking.branch);
  const branchAdmin = resolveBranchAdminWhatsApp(booking.branch);
  const customerWhatsApp = normalizePhoneNumber(booking.phone);

  const enrichedBooking = {
    ...booking,
    branchName: branchContext.branchName,
    branchContact: branchContext.branchContact,
  };

  const tasks = [];

  if (branchAdmin?.adminWhatsApp) {
    tasks.push(
      sendChatMitraMessage({
        to: branchAdmin.adminWhatsApp,
        message: buildAdminMessage(enrichedBooking),
      })
    );
  } else {
    console.warn(`⚠️  No WhatsApp admin number configured for branch ${booking.branch}.`);
  }

  if (customerWhatsApp) {
    tasks.push(
      sendChatMitraMessage({
        to: customerWhatsApp,
        message: buildCustomerMessage(enrichedBooking),
      })
    );
  } else {
    console.warn(`⚠️  No customer phone configured for booking ${booking.id}.`);
  }

  return Promise.allSettled(tasks);
};
