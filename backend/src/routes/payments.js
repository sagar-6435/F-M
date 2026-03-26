import express from 'express';
import { mongoConnections } from '../config/database.js';
import { Booking } from '../models/schemas.js';
import { branchDbs } from '../data/globalDb.js';

const router = express.Router();

// Process payment
router.post('/process', async (req, res) => {
  const { bookingId } = req.body;
  
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate(
        { id: bookingId },
        { paymentStatus: 'paid', updatedAt: new Date() },
        { new: true }
      );
      if (booking) {
        return res.json({ success: true, message: 'Payment processed', booking });
      }
    }
    
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.updatedAt = new Date();
        return res.json({ success: true, message: 'Payment processed', booking });
      }
    }
    
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Mock payment
router.post('/mock', async (req, res) => {
  const { bookingId } = req.body;
  
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate(
        { id: bookingId },
        { paymentStatus: 'paid', updatedAt: new Date() },
        { new: true }
      );
      if (booking) {
        return res.json({ success: true, message: 'Mock payment processed', booking });
      }
    }
    
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.updatedAt = new Date();
        return res.json({ success: true, message: 'Mock payment processed', booking });
      }
    }
    
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error processing mock payment:', error);
    res.status(500).json({ error: 'Failed to process mock payment' });
  }
});

// Get payment status
router.get('/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOne({ id: bookingId });
      if (booking) {
        return res.json({ bookingId: booking.id, paymentStatus: booking.paymentStatus });
      }
    }
    
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === bookingId);
      if (booking) {
        return res.json({ bookingId: booking.id, paymentStatus: booking.paymentStatus });
      }
    }
    
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

export default router;
