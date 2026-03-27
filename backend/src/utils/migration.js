import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../data');
const bookingsFile = path.join(dataDir, 'bookings.json');
const timeSlotsFile = path.join(dataDir, 'timeSlots.json');

/**
 * Clear all bookings and time slots from JSON files
 */
export const clearAllBookings = async () => {
  try {
    const emptyData = {
      'branch-1': [],
      'branch-2': [],
    };
    
    await fs.writeFile(bookingsFile, JSON.stringify(emptyData, null, 2), 'utf-8');
    await fs.writeFile(timeSlotsFile, JSON.stringify(emptyData, null, 2), 'utf-8');
    
    console.log('✓ All bookings and time slots cleared');
    return { success: true, message: 'All bookings cleared' };
  } catch (error) {
    console.error('✗ Error clearing bookings:', error);
    throw error;
  }
};

/**
 * Get all bookings from JSON files
 */
export const getAllBookingsFromFiles = async () => {
  try {
    const bookingsData = await fs.readFile(bookingsFile, 'utf-8');
    const bookings = JSON.parse(bookingsData);
    
    let allBookings = [];
    for (const branchId in bookings) {
      allBookings = allBookings.concat(bookings[branchId]);
    }
    
    return allBookings;
  } catch (error) {
    console.error('✗ Error reading bookings:', error);
    return [];
  }
};

/**
 * Migrate bookings from JSON files to MongoDB
 */
export const migrateBookingsToMongo = async (Booking, TimeSlot) => {
  try {
    const bookingsData = await fs.readFile(bookingsFile, 'utf-8');
    const timeSlotsData = await fs.readFile(timeSlotsFile, 'utf-8');
    
    const bookings = JSON.parse(bookingsData);
    const timeSlots = JSON.parse(timeSlotsData);
    
    let migratedCount = 0;
    let migratedSlots = 0;
    
    // Migrate bookings
    for (const branchId in bookings) {
      for (const booking of bookings[branchId]) {
        try {
          await Booking.findOneAndUpdate(
            { id: booking.id },
            booking,
            { upsert: true }
          );
          migratedCount++;
        } catch (error) {
          console.error(`Failed to migrate booking ${booking.id}:`, error);
        }
      }
    }
    
    // Migrate time slots
    for (const branchId in timeSlots) {
      for (const slot of timeSlots[branchId]) {
        try {
          await TimeSlot.findOneAndUpdate(
            { id: slot.id },
            slot,
            { upsert: true }
          );
          migratedSlots++;
        } catch (error) {
          console.error(`Failed to migrate time slot ${slot.id}:`, error);
        }
      }
    }
    
    console.log(`✓ Migration complete: ${migratedCount} bookings, ${migratedSlots} time slots`);
    return { 
      success: true, 
      migratedBookings: migratedCount,
      migratedTimeSlots: migratedSlots
    };
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
};
