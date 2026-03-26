import mongoose from 'mongoose';

export const bookingSchema = new mongoose.Schema({
  id: String,
  branch: String,
  service: String,
  date: String,
  duration: Number,
  timeSlot: String,
  name: String,
  phone: String,
  email: String,
  decorationRequired: Boolean,
  occasion: String,
  cakeRequired: Boolean,
  selectedCake: mongoose.Schema.Types.Mixed,
  extraDecorations: [mongoose.Schema.Types.Mixed],
  totalPrice: Number,
  paymentStatus: String,
  createdAt: Date,
  updatedAt: Date,
});

export const timeSlotSchema = new mongoose.Schema({
  id: String,
  date: String,
  timeSlot: String,
  service: String,
  isBooked: Boolean,
  bookingId: String,
  createdAt: Date,
});

export const Booking = mongoose.model('Booking', bookingSchema);
export const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
