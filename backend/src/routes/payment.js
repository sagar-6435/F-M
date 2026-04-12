import express from 'express';
import crypto from 'crypto';
import { getBranchModels } from '../config/mongo.js';
import { branchDbs } from '../config/constants.js';
import { saveBookings } from '../utils/persistence.js';
import { sendBookingNotification } from '../utils/notification.js';

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_ENV = process.env.RAZORPAY_ENV || 'sandbox'; // sandbox or production
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

// Helper to get Razorpay auth header
const getRazorpayAuth = () => {
  const credentials = `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
};

// Razorpay Initiate
router.post('/razorpay/initiate', async (req, res) => {
  const { bookingId, amount, phone } = req.body;
  const orderId = `order_${bookingId}_${Date.now()}`;

  try {
    // Create order on Razorpay
    const orderPayload = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: bookingId,
      notes: {
        bookingId: bookingId,
        phone: phone
      }
    };

    const response = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getRazorpayAuth()
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();
    
    if (data.id) {
      // Prepare checkout form data for client-side redirect
      res.json({ 
        success: true, 
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
        keyId: RAZORPAY_KEY_ID,
        redirectUrl: `${FRONTEND_URL}/booking-confirmed?orderId=${data.id}`
      });
    } else {
      console.error('Razorpay Error Response:', data);
      res.status(400).json({ success: false, message: data.error?.description || 'Payment initiation failed' });
    }
  } catch (error) {
    console.error('Razorpay Initiation Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during payment initiation' });
  }
});

// Razorpay Callback (Webhook)
router.post('/razorpay/callback', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  try {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      console.log(`Payment verified for order: ${razorpay_order_id}`);
      res.json({ success: true, message: 'Payment verified' });
    } else {
      console.error('Invalid signature');
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Razorpay Callback Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Razorpay Payment Status Check
router.post('/razorpay/status', async (req, res) => {
  const { orderId } = req.body;
  
  try {
    const response = await fetch(`${RAZORPAY_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': getRazorpayAuth(),
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.id) {
      res.json({ 
        success: true, 
        orderId: data.id,
        amount: data.amount,
        status: data.status,
        payments: data.payments
      });
    } else {
      res.status(404).json({ success: false, error: 'Order not found' });
    }
  } catch (error) {
    console.error('Razorpay Status Error:', error);
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

