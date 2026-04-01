import express from 'express';
import { getBranchModels } from '../config/mongo.js';
import { branchDbs } from '../config/constants.js';
import { saveBookings } from '../utils/persistence.js';
import { sendBookingNotification } from '../utils/notification.js';

const router = express.Router();

router.post('/process', async (req, res) => {
  const { bookingId } = req.body;
  try {
    for (const branchId in branchDbs) {
      const models = getBranchModels(branchId);
      if (models) {
        const booking = await models.Booking.findOneAndUpdate(
          { id: bookingId }, 
          { paymentStatus: 'paid', updatedAt: new Date() }, 
          { new: true }
        );
        if (booking) return res.json({ success: true, message: 'Payment processed', booking });
      }
    }
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.updatedAt = new Date();
        await saveBookings(branchDbs);
        try {
          await sendBookingNotification(booking);
        } catch (notifyError) {
          console.error('Failed to send notification:', notifyError);
        }
        return res.json({ success: true, message: 'Payment processed', booking });
      }
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

router.post('/mock', async (req, res) => {
  const { bookingId } = req.body;
  try {
    for (const branchId in branchDbs) {
      const models = getBranchModels(branchId);
      if (models) {
        const booking = await models.Booking.findOneAndUpdate(
          { id: bookingId }, 
          { paymentStatus: 'paid', updatedAt: new Date() }, 
          { new: true }
        );
        if (booking) return res.json({ success: true, message: 'Mock payment processed', booking });
      }
    }
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.updatedAt = new Date();
        await saveBookings(branchDbs);
        return res.json({ success: true, message: 'Mock payment processed', booking });
      }
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
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
