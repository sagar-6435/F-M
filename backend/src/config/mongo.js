import mongoose from 'mongoose';
import { bookingSchema, timeSlotSchema, branchCatalogSchema } from '../models/schemas.js';

export const mongoConnections = {
  'branch-1': null,
  'branch-2': null,
};

export const connectToMongo = async (branchId, uri) => {
  if (!uri) return;
  try {
    const conn = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    mongoConnections[branchId] = conn;
    console.log(`✓ MongoDB connected for ${branchId}`);
  } catch (err) {
    console.error(`✗ MongoDB connection error for ${branchId}:`, err.message);
  }
};

export const getBranchModels = (branchId) => {
  const conn = mongoConnections[branchId];
  if (!conn) return null;
  
  // Explicitly name models with branch prefix and specify collection names to prevent leakage
  // Mongoose sometimes struggles with identical model names across multiple connections
  return {
    Booking: conn.models[`Booking_${branchId}`] || conn.model(`Booking_${branchId}`, bookingSchema, 'bookings'),
    TimeSlot: conn.models[`TimeSlot_${branchId}`] || conn.model(`TimeSlot_${branchId}`, timeSlotSchema, 'timeslots'),
    BranchCatalog: conn.models[`BranchCatalog_${branchId}`] || conn.model(`BranchCatalog_${branchId}`, branchCatalogSchema, 'catalogs'),
  };
};
