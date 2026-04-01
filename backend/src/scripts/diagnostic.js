import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { bookingSchema } from '../models/schemas.js';

dotenv.config();

const diagnostic = async () => {
  const branches = [
    { id: 'branch-1', name: 'Eluru', uri: process.env.MONGODB_URI_BRANCH1 },
    { id: 'branch-2', name: 'Bhimavaram', uri: process.env.MONGODB_URI_BRANCH2 }
  ];

  console.log('🔍 Running diagnostic for April 3rd, 2026...');

  for (const { id, name, uri } of branches) {
    if (!uri) continue;
    try {
      const conn = await mongoose.createConnection(uri).asPromise();
      const Booking = conn.model('Booking', bookingSchema, 'bookings');
      
      const bookings = await Booking.find({ date: '03-04-2026' });
      // Also try with YYYY-MM-DD
      const bookingsv2 = await Booking.find({ date: '2026-04-03' });
      
      const results = [...bookings, ...bookingsv2];

      if (results.length > 0) {
        console.log(`✅ Found ${results.length} bookings for ${name} (${id}) on 03-04-2026:`);
        results.forEach(b => {
          console.log(` - ID: ${b.id}, Service: ${b.service}, Start: ${b.startTime || b.timeSlot}, Duration: ${b.duration}hr, End: ${b.endTime}, End+Buffer: ${b.endTimeWithBuffer}`);
        });
      } else {
        console.log(`ℹ️ No bookings found for ${name} (${id}) on 03-04-2026.`);
      }
      await conn.close();
    } catch (err) {
      console.error(`✗ Error diagnostics ${id}: ${err.message}`);
    }
  }
  console.log('🏁 Diagnostic complete.');
  process.exit();
};

diagnostic();
