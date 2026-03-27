import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../data');
const bookingsFile = path.join(dataDir, 'bookings.json');
const timeSlotsFile = path.join(dataDir, 'timeSlots.json');

// Ensure data directory exists (non-blocking)
fs.mkdir(dataDir, { recursive: true }).catch(() => {});

export const saveBookings = async (branchDbs) => {
  try {
    const bookingsData = {};
    for (const branchId in branchDbs) {
      bookingsData[branchId] = branchDbs[branchId].bookings;
    }
    console.log('Saving bookings:', JSON.stringify(bookingsData, null, 2));
    await fs.writeFile(bookingsFile, JSON.stringify(bookingsData, null, 2), 'utf-8');
    console.log('✓ Bookings saved to file:', bookingsFile);
  } catch (error) {
    console.error('✗ Error saving bookings:', error);
  }
};

export const loadBookings = async (branchDbs) => {
  try {
    const data = await fs.readFile(bookingsFile, 'utf-8');
    const bookingsData = JSON.parse(data);
    console.log('Loaded bookings from file:', JSON.stringify(bookingsData, null, 2));
    for (const branchId in bookingsData) {
      if (branchDbs[branchId]) {
        branchDbs[branchId].bookings = bookingsData[branchId];
      }
    }
    console.log('✓ Bookings loaded from file');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('✗ Error loading bookings:', error);
    } else {
      console.log('No bookings file found (first run)');
    }
  }
};

export const saveTimeSlots = async (branchDbs) => {
  try {
    const timeSlotsData = {};
    for (const branchId in branchDbs) {
      timeSlotsData[branchId] = branchDbs[branchId].timeSlots;
    }
    console.log('Saving time slots:', JSON.stringify(timeSlotsData, null, 2));
    await fs.writeFile(timeSlotsFile, JSON.stringify(timeSlotsData, null, 2), 'utf-8');
    console.log('✓ Time slots saved to file:', timeSlotsFile);
  } catch (error) {
    console.error('✗ Error saving time slots:', error);
  }
};

export const loadTimeSlots = async (branchDbs) => {
  try {
    const data = await fs.readFile(timeSlotsFile, 'utf-8');
    const timeSlotsData = JSON.parse(data);
    console.log('Loaded time slots from file:', JSON.stringify(timeSlotsData, null, 2));
    for (const branchId in timeSlotsData) {
      if (branchDbs[branchId]) {
        branchDbs[branchId].timeSlots = timeSlotsData[branchId];
      }
    }
    console.log('✓ Time slots loaded from file');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('✗ Error loading time slots:', error);
    } else {
      console.log('No time slots file found (first run)');
    }
  }
};
