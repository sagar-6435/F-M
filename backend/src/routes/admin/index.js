// Admin router — composed from focused sub-routers
import express from 'express';
import * as adminController from '../../controllers/adminController.js';
import { verifyAdmin } from '../../middleware/auth.js';
import { getAllBookingsFromFiles } from '../../utils/migration.js';
import { mongoConnections, getBranchModels } from '../../config/mongo.js';
import { branchDbs } from '../../config/constants.js';

import galleryRouter from './gallery.js';
import videosRouter from './videos.js';
import mediaRouter from './media.js';

const router = express.Router();

// Auth
router.post('/login', adminController.login);
router.post('/logout', (req, res) => res.json({ message: 'Logout successful' }));

// Dashboard
router.get('/dashboard/stats', verifyAdmin, adminController.getDashboardStats);
router.post('/migrate-to-mongo', verifyAdmin, adminController.migrateToMongo);
router.post('/migrate-pricing-to-mongo', verifyAdmin, adminController.migratePricingToMongo);
router.post('/clear-bookings', verifyAdmin, adminController.clearBookings);

router.get('/all-bookings', verifyAdmin, async (req, res) => {
  try {
    const allBookings = await getAllBookingsFromFiles();
    res.json({ count: allBookings.length, bookings: allBookings, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Download Bookings Excel
router.get('/bookings/download', verifyAdmin, async (req, res) => {
  try {
    const branch = req.query.branch || 'all';
    let allBookings = [];
    if (branch === 'all') {
      for (const branchId in mongoConnections) {
        const models = getBranchModels(branchId);
        if (models) {
          const mBookings = await models.Booking.find({ branch: branchId });
          allBookings = allBookings.concat(mBookings);
        }
      }
      for (const branchId in branchDbs) {
        if (!mongoConnections[branchId]) {
          allBookings = allBookings.concat(branchDbs[branchId].bookings);
        }
      }
    } else {
      const models = getBranchModels(branch);
      if (models) {
        allBookings = await models.Booking.find({ branch });
      } else {
        const branchDb = branchDbs[branch];
        if (branchDb) allBookings = branchDb.bookings;
      }
    }

    const confirmedBookings = allBookings.filter(b => ['paid', 'partially-paid'].includes(b.paymentStatus));
    if (confirmedBookings.length === 0) return res.status(404).json({ error: 'No confirmed bookings found' });

    const XLSX = (await import('xlsx')).default;
    const bookingRows = confirmedBookings.map(b => ({
      'Booking ID': b.id,
      'Branch': b.branch,
      'Service': b.service,
      'Date': b.date,
      'Time Slot': b.timeSlot,
      'Duration (hrs)': b.duration,
      'Customer Name': b.name,
      'Phone': b.phone,
      'Occasion': b.customOccasion || b.occasion,
      'Decoration Required': b.decorationRequired ? 'Yes' : 'No',
      'Cake Selected': b.selectedCake ? `${b.selectedCake.name} (₹${b.selectedCake.price})` : 'None',
      'Extra Decorations': b.extraDecorations?.map(d => `${d.name} (₹${d.price})`).join('; ') || 'None',
      'Total Price': b.totalPrice,
      'Payment Status': b.paymentStatus,
      'Booking Date': new Date(b.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(bookingRows);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 15 },
      { wch: 14 }, { wch: 18 }, { wch: 15 }, { wch: 20 },
      { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Confirmed Bookings');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const fileName = `bookings_${branch}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error downloading bookings:', error);
    res.status(500).json({ error: 'Failed to download bookings file' });
  }
});

// Mount sub-routers
router.use('/gallery', galleryRouter);
router.use('/branch-videos', videosRouter);
router.use('/hero-images', mediaRouter);

export default router;
