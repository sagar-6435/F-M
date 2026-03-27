import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdmin } from '../middleware/auth.js';
import { mongoConnections } from '../config/database.js';
import { Booking, TimeSlot } from '../models/schemas.js';
import { branchDbs, getBranchDb } from '../data/globalDb.js';
import { exportBookingToExcel } from '../utils/excelExport.js';
import { saveBookings, saveTimeSlots } from '../utils/persistence.js';

const router = express.Router();

// Create booking
router.post('/', async (req, res) => {
  const { branch } = req.body;
  const branchDb = getBranchDb(branch);
  
  if (!branchDb && !mongoConnections[branch]) return res.status(400).json({ error: 'Invalid branch' });
  
  const booking = {
    id: `B${uuidv4().slice(0, 8).toUpperCase()}`,
    ...req.body,
    paymentStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  try {
    if (mongoConnections[branch]) {
      const newBooking = new Booking(booking);
      await newBooking.save();
      
      const timeSlot = {
        id: uuidv4(),
        date: booking.date,
        timeSlot: booking.timeSlot,
        service: booking.service,
        isBooked: true,
        bookingId: booking.id,
        createdAt: new Date(),
      };
      const newTimeSlot = new TimeSlot(timeSlot);
      await newTimeSlot.save();
    } else if (branchDb) {
      branchDb.bookings.push(booking);
      branchDb.timeSlots.push({
        id: uuidv4(),
        date: booking.date,
        timeSlot: booking.timeSlot,
        service: booking.service,
        isBooked: true,
        bookingId: booking.id,
        createdAt: new Date(),
      });
    }
    
    // Export booking to Excel
    try {
      await exportBookingToExcel(booking);
    } catch (exportError) {
      console.error('Failed to export booking to Excel:', exportError);
      // Don't fail the booking creation if export fails
    }
    
    // Save bookings and time slots to file
    try {
      await saveBookings(branchDbs);
      await saveTimeSlots(branchDbs);
    } catch (saveError) {
      console.error('Failed to save booking data:', saveError);
      // Don't fail the booking creation if save fails
    }
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get all bookings (admin only) - MUST come before /:id route
router.get('/', verifyAdmin, async (req, res) => {
  const { status, branch, startDate, endDate } = req.query;
  let allBookings = [];
  
  try {
    if (branch && mongoConnections[branch]) {
      let query = {};
      if (status) query.paymentStatus = status;
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }
      allBookings = await Booking.find(query);
    } else if (branch) {
      const branchDb = getBranchDb(branch);
      if (branchDb) allBookings = branchDb.bookings;
    } else {
      if (mongoConnections['branch-1']) {
        const mongoBookings = await Booking.find({});
        allBookings = allBookings.concat(mongoBookings);
      }
      if (mongoConnections['branch-2']) {
        const mongoBookings = await Booking.find({});
        allBookings = allBookings.concat(mongoBookings);
      }
      for (const branchId in branchDbs) {
        allBookings = allBookings.concat(branchDbs[branchId].bookings);
      }
    }
    
    let filtered = allBookings;
    if (status) filtered = filtered.filter(b => b.paymentStatus === status);
    if (startDate && endDate) {
      filtered = filtered.filter(b => b.date >= startDate && b.date <= endDate);
    }
    
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const mongoBooking = await Booking.findOne({ id });
      if (mongoBooking) return res.json(mongoBooking);
    }
    
    for (const branchId in branchDbs) {
      const booking = branchDbs[branchId].bookings.find(b => b.id === id);
      if (booking) return res.json(booking);
    }
    
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Update booking
router.put('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndUpdate({ id }, req.body, { new: true });
      if (booking) return res.json(booking);
    }
    
    for (const branchId in branchDbs) {
      const branchDb = branchDbs[branchId];
      const booking = branchDb.bookings.find(b => b.id === id);
      if (booking) {
        Object.assign(booking, req.body, { updatedAt: new Date() });
        return res.json(booking);
      }
    }
    
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Delete booking
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    if (mongoConnections['branch-1'] || mongoConnections['branch-2']) {
      const booking = await Booking.findOneAndDelete({ id });
      if (booking) {
        await TimeSlot.deleteMany({ bookingId: id });
        return res.json({ message: 'Booking cancelled' });
      }
    }
    
    for (const branchId in branchDbs) {
      const branchDb = branchDbs[branchId];
      const index = branchDb.bookings.findIndex(b => b.id === id);
      
      if (index !== -1) {
        const booking = branchDb.bookings[index];
        branchDb.bookings.splice(index, 1);
        
        const slotIndex = branchDb.timeSlots.findIndex(s => s.bookingId === booking.id);
        if (slotIndex !== -1) branchDb.timeSlots.splice(slotIndex, 1);
        
        // Save changes to file
        try {
          await saveBookings(branchDbs);
          await saveTimeSlots(branchDbs);
        } catch (saveError) {
          console.error('Failed to save booking data:', saveError);
        }
        
        return res.json({ message: 'Booking cancelled' });
      }
    }
    
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;
