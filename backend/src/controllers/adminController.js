import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBranchModels, mongoConnections } from '../config/mongo.js';
import { branchDbs, branchPricingDbs } from '../config/constants.js';
import { clearAllBookings, getAllBookingsFromFiles } from '../utils/migration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const login = (req, res) => {
  const { password } = req.body;
  const trimmedPassword = password ? password.trim() : '';
  
  // Branch-specific passwords (fall back to shared ADMIN_PASSWORD)
  const branch1Password = (process.env.ADMIN_PASSWORD_BRANCH1 || process.env.ADMIN_PASSWORD || '').trim();
  const branch2Password = (process.env.ADMIN_PASSWORD_BRANCH2 || process.env.ADMIN_PASSWORD || '').trim();
  
  let assignedBranch = null;
  if (trimmedPassword === branch1Password) {
    assignedBranch = 'branch-1';
  } else if (trimmedPassword === branch2Password) {
    assignedBranch = 'branch-2';
  }
  
  if (assignedBranch) {
    const token = jwt.sign({ role: 'admin', branch: assignedBranch }, process.env.JWT_SECRET, { expiresIn: '3650d' });
    res.json({ token, branch: assignedBranch, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
};

export const getDashboardStats = async (req, res) => {
  const { branch, startDate, endDate } = req.query;
  let allBookings = [];
  
  try {
    const branchesToQuery = branch ? [branch] : Object.keys(branchDbs);
    
    for (const bId of branchesToQuery) {
      const models = getBranchModels(bId);
      if (models) {
        let query = {};
        if (startDate && endDate) {
          query.date = { $gte: startDate, $lte: endDate };
        }
        const branchBookings = await models.Booking.find(query);
        allBookings = allBookings.concat(branchBookings.map(b => b.toObject()));
      } else {
        // Fallback for file-based
        const branchDb = branchDbs[bId];
        if (branchDb) {
          let branchBookings = branchDb.bookings;
          if (startDate && endDate) {
            branchBookings = branchBookings.filter(b => b.date >= startDate && b.date <= endDate);
          }
          allBookings = allBookings.concat(branchBookings);
        }
      }
    }
    
    // Final filtering if cross-branch query had specific branch but models weren't available correctly
    if (branch) {
      allBookings = allBookings.filter(b => b.branch === branch);
    }
    
    const totalBookings = allBookings.length;
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid').length;
    const pendingBookings = allBookings.filter(b => b.paymentStatus === 'pending').length;
    const totalRevenue = allBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalPrice, 0);
    
    res.json({ totalBookings, paidBookings, pendingBookings, totalRevenue });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const migrateToMongo = async (req, res) => {
  try {
    const hasConnection = Object.values(mongoConnections).some(conn => conn !== null);
    if (!hasConnection) {
      return res.status(400).json({ error: 'MongoDB not connected.' });
    }
    
    let totalMigratedBookings = 0;
    let totalMigratedTimeSlots = 0;

    const dataDir = path.join(__dirname, '../../data');
    const bookingsData = await fs.readFile(path.join(dataDir, 'bookings.json'), 'utf-8');
    const timeSlotsData = await fs.readFile(path.join(dataDir, 'timeSlots.json'), 'utf-8');
    const bookingsByBranch = JSON.parse(bookingsData);
    const timeSlotsByBranch = JSON.parse(timeSlotsData);

    for (const branchId in branchDbs) {
      const models = getBranchModels(branchId);
      if (models && (bookingsByBranch[branchId] || timeSlotsByBranch[branchId])) {
        const branchBookings = bookingsByBranch[branchId] || [];
        for (const b of branchBookings) {
          await models.Booking.findOneAndUpdate({ id: b.id }, b, { upsert: true });
          totalMigratedBookings++;
        }

        const branchSlots = timeSlotsByBranch[branchId] || [];
        for (const s of branchSlots) {
          await models.TimeSlot.findOneAndUpdate({ id: s.id }, s, { upsert: true });
          totalMigratedTimeSlots++;
        }
      }
    }

    res.json({ 
      success: true,
      migratedBookings: totalMigratedBookings,
      migratedTimeSlots: totalMigratedTimeSlots,
      message: 'Bookings migrated successfully'
    });
  } catch (error) {
    console.error('Error migrating:', error);
    res.status(500).json({ error: 'Failed to migrate' });
  }
};

export const migratePricingToMongo = async (req, res) => {
  try {
    let migratedBranches = 0;
    for (const branchId in branchPricingDbs) {
      const models = getBranchModels(branchId);
      if (!models) continue;

      const catalog = branchPricingDbs[branchId];
      await models.BranchCatalog.findOneAndUpdate(
        { branch: branchId },
        {
          branch: branchId,
          pricing: catalog.pricing,
          cakes: catalog.cakes,
          decorations: catalog.decorations,
          decorationPrice: catalog.decorationPrice,
          testimonials: catalog.testimonials,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      migratedBranches++;
    }
    res.json({ success: true, migratedBranches });
  } catch (error) {
    console.error('Error migrating pricing:', error);
    res.status(500).json({ error: 'Failed to migrate pricing' });
  }
};

export const clearBookings = async (req, res) => {
  try {
    for (const branchId in branchDbs) {
      branchDbs[branchId].bookings = [];
      branchDbs[branchId].timeSlots = [];
    }
    await clearAllBookings();
    res.json({ success: true, message: 'Cleaned' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear' });
  }
};
