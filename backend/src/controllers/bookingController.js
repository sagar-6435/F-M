import { v4 as uuidv4 } from 'uuid';
import { getBranchModels } from '../config/mongo.js';
import { branchDbs, globalDb, defaultPricing, defaultCakes, defaultDecorations } from '../config/constants.js';
import { canFitBookingInOperatingHours, getBlockedSlotsForBooking, parse12HourTime, isOverlappingWithBuffer, getAvailableStartSlots, calculateBookingTimes } from '../utils/timeUtils.js';
import { saveBookings, saveTimeSlots } from '../utils/persistence.js';
import { getCatalogForBranch } from './catalogController.js';
import { sendAdminSmsNotification } from '../utils/sms.js';

export const createBooking = async (req, res) => {
  const { branch } = req.body;
  const branchDb = branchDbs[branch];
  const models = getBranchModels(branch);
  
  if (!branchDb && !models) {
    console.error(`✗ Create Booking failed: Invalid branch "${branch}"`);
    return res.status(400).json({ error: 'Invalid branch' });
  }

  console.log(`📝 Processing booking for branch: ${branch} (Using ${models ? 'MongoDB' : 'Local File'})`);
  const { timeSlot, duration, membersCount } = req.body;
  if (branch === 'branch-2' && membersCount > 10) {
    return res.status(400).json({ error: 'Maximum 10 persons allowed for Bhimavaram branch' });
  }
  const bookingTimes = calculateBookingTimes(timeSlot, duration);

  const booking = {
    id: `B${uuidv4().slice(0, 8).toUpperCase()}`,
    ...req.body,
    ...bookingTimes,
    paymentStatus: req.body.paymentStatus || 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  try {
    if (!canFitBookingInOperatingHours(booking.timeSlot, booking.duration)) {
      return res.status(400).json({ error: 'Selected time is outside available hours (10:00 AM - 12:00 AM)' });
    }

    const slotsToBlock = getBlockedSlotsForBooking(booking.timeSlot, booking.duration);
    if (!slotsToBlock.length) {
      return res.status(400).json({ error: 'Invalid booking time slot' });
    }

    let existingBookings = [];
    if (models) {
      // Find both paid (confirmed) and pending (in-process) bookings for conflict check
      existingBookings = await models.Booking.find({ 
        branch, 
        date: booking.date, 
        service: booking.service,
        paymentStatus: { $in: ['paid', 'pending'] } 
      });
    } else if (branchDb) {
      existingBookings = branchDb.bookings.filter(b => 
        b.date === booking.date && 
        b.service === booking.service && 
        ['paid', 'pending'].includes(b.paymentStatus)
      );
    }

    const startMinutes = parse12HourTime(booking.timeSlot);
    let conflictFound = false;
    let conflictingBooking = null;
    
    for (const b of existingBookings) {
      if (isOverlappingWithBuffer(startMinutes, booking.duration, b.timeSlot, b.duration)) {
        // Only a conflict if it's NOT the same person retrying the same slot
        if (b.phone === booking.phone && b.timeSlot === booking.timeSlot && b.paymentStatus === 'pending') {
          console.log(`ℹ Retrying existing pending booking ${b.id} for ${booking.phone}`);
          return res.status(200).json(b);
        }
        
        // If it's a PAID booking, or a PENDING booking from someone else, it's a conflict
        conflictFound = true;
        conflictingBooking = b;
        break;
      }
    }
    
    if (conflictFound) {
      console.warn(`✖ Booking conflict: Requested ${booking.timeSlot} (${booking.duration}h) overlaps with ${conflictingBooking.paymentStatus} booking ${conflictingBooking.id} (${conflictingBooking.timeSlot}, ${conflictingBooking.duration}h)`);
      return res.status(409).json({
        error: `Slot not available at ${booking.timeSlot} for ${booking.duration}h. It overlaps with another booking.`,
        conflictingId: conflictingBooking.id
      });
    }

    if (models) {
      const newBooking = new models.Booking(booking);
      await newBooking.save();

      await models.TimeSlot.insertMany(
        slotsToBlock.map((slotTime) => ({
          id: uuidv4(),
          date: booking.date,
          timeSlot: slotTime,
          service: booking.service,
          isBooked: true,
          bookingId: booking.id,
          createdAt: new Date(),
        }))
      );
      console.log(`✓ Booking ${booking.id} created in MongoDB for ${branch} on ${booking.date}`);
    } else if (branchDb) {
      branchDb.bookings.push(booking);
      slotsToBlock.forEach((slotTime) => {
        branchDb.timeSlots.push({
          id: uuidv4(),
          date: booking.date,
          timeSlot: slotTime,
          service: booking.service,
          isBooked: true,
          bookingId: booking.id,
          createdAt: new Date(),
        });
      });
      
      try {
        await saveBookings(branchDbs);
        await saveTimeSlots(branchDbs);
        console.log(`✓ Booking ${booking.id} created and saved to file for ${branch} on ${booking.date}`);
      } catch (saveError) {
        console.error('Failed to save booking data:', saveError);
      }
    }
    
    // Send SMS notification if payment is already confirmed (e.g. manual booking)
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'partially-paid') {
      sendAdminSmsNotification(booking).catch(err => 
        console.error('✗ Admin SMS notification failed:', err)
      );
    }
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    for (const branchId in branchDbs) {
      const models = getBranchModels(branchId);
      if (models) {
        const mongoBooking = await models.Booking.findOne({ id });
        if (mongoBooking) return res.json(mongoBooking);
      }
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
};

export const getAllBookings = async (req, res) => {
  const { status, branch, startDate, endDate } = req.query;
  let allBookings = [];
  
  try {
    if (branch) {
      const models = getBranchModels(branch);
      if (models) {
        let query = { branch };
        if (status) query.paymentStatus = status;
        if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
        allBookings = await models.Booking.find(query);
      } else {
        const branchDb = branchDbs[branch];
        if (branchDb) allBookings = branchDb.bookings;
      }
    } else {
      for (const branchId in branchDbs) {
        const models = getBranchModels(branchId);
        if (models) {
          let query = {};
          if (status) query.paymentStatus = status;
          if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
          const mongoBookings = await models.Booking.find(query);
          allBookings = allBookings.concat(mongoBookings.map(b => b.toObject()));
        }
        if (!models) {
            allBookings = allBookings.concat(branchDbs[branchId].bookings);
        }
      }
    }
    
    let filtered = allBookings;
    if (status && !branch) filtered = filtered.filter(b => b.paymentStatus === status);
    if (startDate && endDate && !branch) filtered = filtered.filter(b => b.date >= startDate && b.date <= endDate);
    
    filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const timeA = parse12HourTime(a.timeSlot) || 0;
      const timeB = parse12HourTime(b.timeSlot) || 0;
      return timeA - timeB;
    });
    
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const updateBooking = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  try {
    for (const branchId in branchDbs) {
      const models = getBranchModels(branchId);
      if (models) {
        const existingBooking = await models.Booking.findOne({ id });
        if (existingBooking) {
          // Recalculate times if timeSlot or duration changed
          if (updateData.timeSlot || updateData.duration) {
            const newTimes = calculateBookingTimes(
              updateData.timeSlot || existingBooking.timeSlot,
              updateData.duration || existingBooking.duration
            );
            Object.assign(updateData, newTimes);
          }

          const booking = await models.Booking.findOneAndUpdate({ id }, updateData, { new: true });
          
          if (updateData.timeSlot || updateData.duration) {
            await models.TimeSlot.deleteMany({ bookingId: id });
            const slotsToBlock = getBlockedSlotsForBooking(
              updateData.timeSlot || existingBooking.timeSlot,
              updateData.duration || existingBooking.duration
            );
            
            await models.TimeSlot.insertMany(
              slotsToBlock.map((slotTime) => ({
                id: uuidv4(),
                date: updateData.date || existingBooking.date,
                timeSlot: slotTime,
                service: updateData.service || existingBooking.service,
                isBooked: true,
                bookingId: id,
                createdAt: new Date(),
              }))
            );
          }
          return res.json(booking);
        }
      }
    }
    
    for (const branchId in branchDbs) {
      const branchDb = branchDbs[branchId];
      const booking = branchDb.bookings.find(b => b.id === id);
      if (booking) {
        if (updateData.timeSlot || updateData.duration) {
          const newTimes = calculateBookingTimes(
            updateData.timeSlot || booking.timeSlot,
            updateData.duration || booking.duration
          );
          Object.assign(updateData, newTimes);
        }

        Object.assign(booking, updateData, { updatedAt: new Date() });
        
        if (updateData.timeSlot || updateData.duration) {
          branchDb.timeSlots = branchDb.timeSlots.filter(s => s.bookingId !== id);
          const slotsToBlock = getBlockedSlotsForBooking(booking.timeSlot, booking.duration);
          slotsToBlock.forEach((slotTime) => {
            branchDb.timeSlots.push({
              id: uuidv4(),
              date: booking.date,
              timeSlot: slotTime,
              service: booking.service,
              isBooked: true,
              bookingId: id,
              createdAt: new Date(),
            });
          });
        }
        
        try {
          await saveBookings(branchDbs);
          await saveTimeSlots(branchDbs);
        } catch (saveError) {
          console.error('Failed to save booking data:', saveError);
        }
        return res.json(booking);
      }
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

export const deleteBooking = async (req, res) => {
  const { id } = req.params;
  try {
    for (const branchId in branchDbs) {
      const models = getBranchModels(branchId);
      if (models) {
        const booking = await models.Booking.findOneAndDelete({ id });
        if (booking) {
          await models.TimeSlot.deleteMany({ bookingId: id });
          console.log(`✓ Booking ${id} and its slots deleted from MongoDB`);
          return res.json({ message: 'Booking cancelled' });
        }
      }
    }
    for (const branchId in branchDbs) {
      const branchDb = branchDbs[branchId];
      const index = branchDb.bookings.findIndex(b => b.id === id);
      if (index !== -1) {
        const booking = branchDb.bookings[index];
        branchDb.bookings.splice(index, 1);
        branchDb.timeSlots = branchDb.timeSlots.filter(s => s.bookingId !== id);
        try {
          await saveBookings(branchDbs);
          await saveTimeSlots(branchDbs);
          console.log(`✓ Booking ${id} and its slots deleted from file-based store`);
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
};

export const deleteMultipleBookings = async (req, res) => {
  const { ids, code } = req.body;
  
  if (code !== 'sai@932') {
    return res.status(403).json({ error: 'Invalid security code' });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided' });
  }

  try {
    let deletedCount = 0;
    for (const branchId in branchDbs) {
      const models = getBranchModels(branchId);
      if (models) {
        const result = await models.Booking.deleteMany({ id: { $in: ids } });
        if (result.deletedCount > 0) {
          await models.TimeSlot.deleteMany({ bookingId: { $in: ids } });
          deletedCount += result.deletedCount;
        }
      }
    }

    // Also check file-based
    for (const branchId in branchDbs) {
      const branchDb = branchDbs[branchId];
      const initialCount = branchDb.bookings.length;
      branchDb.bookings = branchDb.bookings.filter(b => !ids.includes(b.id));
      branchDb.timeSlots = branchDb.timeSlots.filter(s => !ids.includes(s.bookingId));
      
      if (branchDb.bookings.length !== initialCount) {
        deletedCount += (initialCount - branchDb.bookings.length);
        await saveBookings(branchDbs);
        await saveTimeSlots(branchDbs);
      }
    }

    res.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Error deleting multiple bookings:', error);
    res.status(500).json({ error: 'Failed to delete bookings' });
  }
};

export const getAvailability = async (req, res) => {
  const { branchId, date, service } = req.params;
  const duration = Number(req.query.duration || 1);
  const branchDb = branchDbs[branchId];
  const models = getBranchModels(branchId);
  
  if (!branchDb && !models) return res.status(404).json({ error: 'Branch not found' });
  
  try {
    let bookings = [];
    if (models) {
      // Get PAID or PARTIALLY-PAID bookings to mark slots as blocked
      bookings = await models.Booking.find({ 
        branch: branchId, 
        date, 
        service, 
        paymentStatus: { $in: ['paid', 'partially-paid'] } 
      });
    } else if (branchDb) {
      // Get PAID or PARTIALLY-PAID bookings to mark slots as blocked
      bookings = branchDb.bookings.filter(b => 
        b.date === date && 
        b.service === service && 
        ['paid', 'partially-paid'].includes(b.paymentStatus)
      );
    }
    
    console.log(`📋 Availability check for ${branchId} on ${date} (${service}): Found ${bookings.length} paid bookings`);
    if (bookings.length > 0) {
      bookings.forEach(b => console.log(`  - Booking: ${b.id} | Time: ${b.timeSlot} | Duration: ${b.duration}h | Status: ${b.paymentStatus}`));
    }
    
    const availableSlots = getAvailableStartSlots(bookings, duration);
    const bookedSlotsList = bookings.reduce((acc, b) => {
        return acc.concat(getBlockedSlotsForBooking(b.timeSlot, b.duration));
    }, []);
    
    console.log(`✅ Available slots: ${availableSlots.length}, Blocked slots: ${bookedSlotsList.length}`);
    
    const today = new Date().toISOString().split('T')[0];
    let filteredAvailable = availableSlots;
    if (date === today) {
      const now = new Date();
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      filteredAvailable = availableSlots.filter(slot => {
        const slotMinutes = parse12HourTime(slot);
        return slotMinutes > currentTimeMinutes + 60;
      });
    }
    
    res.json({ availableSlots: filteredAvailable, bookedSlots: bookedSlotsList });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

export const getBookingInit = async (req, res) => {
  try {
    const { branchId } = req.params;
    const catalog = await getCatalogForBranch(branchId);
    
    if (!catalog && !globalDb.branches.find(b => b.id === branchId)) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const pricingData = catalog?.pricing || defaultPricing;
    console.log(`[BOOKING-INIT] Branch ${branchId} - pricing data:`, JSON.stringify(pricingData));

    // Set cache-control headers to prevent caching and ensure fresh data from DB
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Fetch all branches with potential DB-stored details
    const branches = [];
    const branchIds = Object.keys(branchDbs);
    for (const bId of branchIds) {
      const bCatalog = await getCatalogForBranch(bId);
      if (bCatalog) {
        branches.push({
          id: bId,
          name: bCatalog.name || (globalDb.branches.find(b => b.id === bId)?.name) || bId,
          address: bCatalog.address || (globalDb.branches.find(b => b.id === bId)?.address) || '',
          phone: bCatalog.phone || (globalDb.branches.find(b => b.id === bId)?.phone) || '',
          mapLink: bCatalog.mapLink || (globalDb.branches.find(b => b.id === bId)?.mapLink) || ''
        });
      }
    }

    res.json({
      branches,
      occasions: globalDb.occasions,
      pricing: pricingData,
      cakes: catalog?.cakes || defaultCakes,
      decorations: catalog?.decorations || defaultDecorations,
      decorationPrice: catalog?.decorationPrice ?? 1500
    });
  } catch (error) {
    console.error('Error in booking-init:', error);
    res.status(500).json({ error: 'Failed to initialize booking data' });
  }
};
