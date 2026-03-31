import express from 'express';
import { mongoConnections } from '../config/database.js';
import { TimeSlot } from '../models/schemas.js';
import { getBranchDb } from '../data/globalDb.js';

const router = express.Router();

const OPENING_TIME_MINUTES = 10 * 60; // 10:00 AM
const CLOSING_TIME_MINUTES = 23 * 60 + 30; // 11:30 PM
const SLOT_STEP_MINUTES = 30;

const to12HourTime = (minutes) => {
  const period = minutes >= 12 * 60 ? 'PM' : 'AM';
  const hour24 = Math.floor(minutes / 60) % 24;
  const hour12 = hour24 % 12 || 12;
  const mins = minutes % 60;
  return `${hour12}:${String(mins).padStart(2, '0')} ${period}`;
};

const parse12HourTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (minutes < 0 || minutes >= 60 || hours < 1 || hours > 12) return null;
  if (hours === 12) hours = 0;
  if (period === 'PM') hours += 12;
  return hours * 60 + minutes;
};

const buildDaySlots = () => {
  const slots = [];
  for (let minute = OPENING_TIME_MINUTES; minute <= CLOSING_TIME_MINUTES; minute += SLOT_STEP_MINUTES) {
    slots.push(to12HourTime(minute));
  }
  return slots;
};

const calculateGapMinutes = (bookedSlots, startSlotIndex, daySlots) => {
  if (bookedSlots.length === 0) return Infinity;
  
  const startSlot = daySlots[startSlotIndex];
  const startMinutes = parse12HourTime(startSlot);
  
  let lastBookedMinutes = -1;
  for (const bookedSlot of bookedSlots) {
    const bookedMinutes = parse12HourTime(bookedSlot);
    if (bookedMinutes < startMinutes && bookedMinutes > lastBookedMinutes) {
      lastBookedMinutes = bookedMinutes;
    }
  }
  
  if (lastBookedMinutes === -1) return Infinity;
  
  const lastBookedEndMinutes = lastBookedMinutes + SLOT_STEP_MINUTES;
  return startMinutes - lastBookedEndMinutes;
};

const getAllowedDurationsForGap = (gapMinutes) => {
  if (gapMinutes >= 3 * 60) {
    return [1, 2, 3];
  } else if (gapMinutes >= 1 * 60) {
    return [1];
  }
  return [];
};

const getAvailableSlotsWithGapRestrictions = (bookedSlots, requestedDuration = 1) => {
  const daySlots = buildDaySlots();
  const bookedSet = new Set(bookedSlots);
  const needed = Math.max(1, Math.round((Number(requestedDuration) * 60) / SLOT_STEP_MINUTES));
  const available = [];

  for (let i = 0; i < daySlots.length; i++) {
    const start = daySlots[i];
    const startMinutes = parse12HourTime(start);
    if (startMinutes === null) continue;

    const endMinutes = startMinutes + Number(requestedDuration) * 60;
    if (endMinutes > CLOSING_TIME_MINUTES + SLOT_STEP_MINUTES) continue;

    let canUse = true;
    for (let j = 0; j < needed; j++) {
      const slot = daySlots[i + j];
      if (!slot || bookedSet.has(slot)) {
        canUse = false;
        break;
      }
    }
    
    if (!canUse) continue;

    const gapMinutes = calculateGapMinutes(bookedSlots, i, daySlots);
    const allowedDurations = getAllowedDurationsForGap(gapMinutes);
    
    if (allowedDurations.includes(requestedDuration)) {
      available.push(start);
    }
  }

  return available;
};

// Get available slots
router.get('/:branchId/:date/:service', async (req, res) => {
  const { branchId, date, service } = req.params;
  const duration = parseInt(req.query.duration) || 1;
  const branchDb = getBranchDb(branchId);
  
  if (!branchDb && !mongoConnections[branchId]) return res.status(404).json({ error: 'Branch not found' });
  
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
    
    const availableSlots = getAvailableSlotsWithGapRestrictions(bookedSlots, duration);
    res.json({ availableSlots, bookedSlots });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

export default router;
