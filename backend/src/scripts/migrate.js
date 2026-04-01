import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { bookingSchema, timeSlotSchema } from '../models/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../data');

dotenv.config();

const migrate = async () => {
  const branches = [
    { id: 'branch-1', uri: process.env.MONGODB_URI_BRANCH1 },
    { id: 'branch-2', uri: process.env.MONGODB_URI_BRANCH2 }
  ];

  console.log('🚀 Starting migration...');

  try {
    const bookingsData = await fs.readFile(path.join(dataDir, 'bookings.json'), 'utf-8');
    const timeSlotsData = await fs.readFile(path.join(dataDir, 'timeSlots.json'), 'utf-8');
    const bookingsByBranch = JSON.parse(bookingsData);
    const timeSlotsByBranch = JSON.parse(timeSlotsData);

    for (const { id, uri } of branches) {
      if (!uri) {
        console.warn(`⚠️ No URI found for ${id}, skipping.`);
        continue;
      }

      console.log(`🔗 Connecting to MongoDB for ${id}...`);
      const conn = await mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }).asPromise();
      
      const Booking = conn.model('Booking', bookingSchema);
      const TimeSlot = conn.model('TimeSlot', timeSlotSchema);

      const bookings = bookingsByBranch[id] || [];
      const slots = timeSlotsByBranch[id] || [];

      console.log(`📦 Migrating ${bookings.length} bookings and ${slots.length} slots for ${id}...`);

      for (const booking of bookings) {
        await Booking.findOneAndUpdate({ id: booking.id }, booking, { upsert: true });
      }

      for (const slot of slots) {
        await TimeSlot.findOneAndUpdate({ id: slot.id }, slot, { upsert: true });
      }

      console.log(`✅ ${id} migration complete.`);
      await conn.close();
    }

    console.log('🏆 All data migrated successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit();
  }
};

migrate();
