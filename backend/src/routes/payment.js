import express from 'express';
import crypto from 'crypto';
import { getBranchModels } from '../config/mongo.js';
import { branchDbs } from '../config/constants.js';
import { saveBookings } from '../utils/persistence.js';
import { sendBookingNotification } from '../utils/notification.js';

const router = express.Router();

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX;
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'sandbox'; // sandbox or production
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const PHONEPE_BASE_URL = PHONEPE_ENV === 'production' 
  ? 'https://api.phonepe.com/apis/hermes' 
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// PhonePe Initiate
router.post('/phonepe/initiate', async (req, res) => {
  const { bookingId, amount, phone } = req.body;
  const merchantTransactionId = `${bookingId}_${Date.now()}`;
  const userId = `U${phone}`;

  const payload = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: userId,
    amount: amount * 100, // PhonePe expects amount in paise
    redirectUrl: `${FRONTEND_URL}/booking-confirmed?transactionId=${merchantTransactionId}`,
    redirectMode: 'REDIRECT',
    callbackUrl: `${BACKEND_URL}/api/payments/phonepe/callback`,
    mobileNumber: phone,
    paymentInstrument: {
      type: 'PAY_PAGE'
    }
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const stringToSign = base64Payload + "/pg/v1/pay" + PHONEPE_SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
  const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

  try {
    const response = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const data = await response.json();
    if (data.success) {
      res.json({ 
        success: true, 
        redirectUrl: data.data.instrumentResponse.redirectInfo.url,
        merchantTransactionId 
      });
    } else {
      console.error('PhonePe Error Response:', data);
      res.status(400).json({ success: false, message: data.message || 'Payment initiation failed' });
    }
  } catch (error) {
    console.error('PhonePe Initiation Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during payment initiation' });
  }
});

// PhonePe Callback (Webhook)
router.post('/phonepe/callback', async (req, res) => {
  // Use X-VERIFY header to validate callback authenticity in production
  const { response } = req.body;
  const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));
  
  if (decodedResponse.success && decodedResponse.code === 'PAYMENT_SUCCESS') {
    const merchantTransactionId = decodedResponse.data.merchantTransactionId;
    // Note: We need a way to link MTID back to bookingId if we want to update it here
    // For now, we rely on the frontend status check which has both.
    console.log(`Payment success for transaction: ${merchantTransactionId}`);
  }
  
  res.status(200).send('OK');
});

// PhonePe Status Check
router.post('/phonepe/status', async (req, res) => {
  const { transactionId } = req.body;
  
  const stringToSign = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}${PHONEPE_SALT_KEY}`;
  const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
  const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

  try {
    const response = await fetch(`${PHONEPE_BASE_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}`, {
      method: 'GET',
      headers: {
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('PhonePe Status Error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Helper to find and update booking across any storage
const updateBookingPayment = async (bookingId, amountPaid, paymentType) => {
  const amt = Number(amountPaid);
  
  // Try MongoDB branches
  for (const branchId in ['branch-1', 'branch-2']) {
    const models = getBranchModels(branchId);
    if (models) {
      const booking = await models.Booking.findOne({ id: bookingId });
      if (booking) {
        booking.paymentStatus = (amt >= booking.totalPrice) ? 'paid' : 'partially-paid';
        booking.amountPaid = amt;
        booking.balanceAmount = Math.max(0, booking.totalPrice - amt);
        booking.paymentType = paymentType || (amt >= booking.totalPrice ? 'full' : 'advance');
        booking.updatedAt = new Date();
        await booking.save();
        
        // Send email notification
        try {
          await sendBookingNotification(booking);
        } catch (emailErr) {
          console.error('✗ Email notification failed but booking updated:', emailErr);
        }
        
        return booking;
      }
    }
  }

  // Try local file branches
  for (const branchId in branchDbs) {
    const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.paymentStatus = (amt >= booking.totalPrice) ? 'paid' : 'partially-paid';
      booking.amountPaid = amt;
      booking.balanceAmount = Math.max(0, booking.totalPrice - amt);
      booking.paymentType = paymentType || (amt >= booking.totalPrice ? 'full' : 'advance');
      booking.updatedAt = new Date();
      await saveBookings(branchDbs);
      
      // Send email notification
      try {
        await sendBookingNotification(booking);
      } catch (emailErr) {
        console.error('✗ Email notification failed but booking updated:', emailErr);
      }
      
      return booking;
    }
  }
  
  return null;
};

router.post('/process', async (req, res) => {
  const { bookingId, amountPaid, paymentType } = req.body;
  try {
    const booking = await updateBookingPayment(bookingId, amountPaid, paymentType);
    if (booking) {
      return res.json({ success: true, message: 'Payment processed', booking });
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

router.post('/mock', async (req, res) => {
  const { bookingId, amountPaid, paymentType } = req.body;
  try {
    const booking = await updateBookingPayment(bookingId, amountPaid, paymentType);
    if (booking) {
      return res.json({ success: true, message: 'Mock payment processed', booking });
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error processing mock payment:', error);
    res.status(500).json({ error: 'Failed to process mock payment' });
  }
});

router.get('/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  try {
    for (const branchId in branchDbs) {
      const models = getBranchModels(branchId);
      if (models) {
        const booking = await models.Booking.findOne({ id: bookingId });
        if (booking) return res.json({ bookingId: booking.id, paymentStatus: booking.paymentStatus });
      }
    }
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) return res.json({ bookingId: booking.id, paymentStatus: booking.paymentStatus });
    }
    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;

