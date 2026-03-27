import express from 'express';
import { mongoConnections } from '../config/database.js';
import { TimeSlot } from '../models/schemas.js';
import { getBranchDb } from '../data/globalDb.js';

const router = express.Router();

// Get available slots
router.get('/:branchId/:date/:service', async (req, res) => {
  const { branchId, date, service } = req.params;
  const branchDb = getBranchDb(branchId);
  
  if (!branchDb && !mongoConnections[branchId]) return res.status(404).json({ error: 'Branch not found' });
  
  const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];
  let bookedSlots = [];
  
  try {
    if (mongoConnections[branchId]) {
      const slots = await TimeSlot.find({ date, service });
      bookedSlots = slots.map(slot => slot.timeSlot);
    } else if (branchDb) {
      bookedSlots = branchDb.timeSlots
        .filter(slot => slot.date === date && slot.service === service)
        .map(slot => slot.timeSlot);
    }
    
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));
    res.json({ availableSlots, bookedSlots });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

export default router;
