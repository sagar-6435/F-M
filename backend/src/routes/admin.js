import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyAdmin } from '../middleware/auth.js';
import { mongoConnections } from '../config/database.js';
import { Booking } from '../models/schemas.js';
import { branchDbs, getBranchDb } from '../data/globalDb.js';

const router = express.Router();

// Admin Login
router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Trim whitespace from both sides
  const trimmedPassword = password ? password.trim() : '';
  const trimmedAdminPassword = adminPassword ? adminPassword.trim() : '';
  
  if (trimmedPassword === trimmedAdminPassword) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Admin Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Dashboard Stats
router.get('/dashboard/stats', verifyAdmin, async (req, res) => {
  const { branch } = req.query;
  let allBookings = [];
  
  try {
    if (branch && mongoConnections[branch]) {
      allBookings = await Booking.find({});
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
    
    const totalBookings = allBookings.length;
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid').length;
    const pendingBookings = allBookings.filter(b => b.paymentStatus === 'pending').length;
    const totalRevenue = allBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    
    res.json({ totalBookings, paidBookings, pendingBookings, totalRevenue });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
