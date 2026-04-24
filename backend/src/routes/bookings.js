import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Availability
router.get('/availability/:branchId/:date/:service', bookingController.getAvailability);

// Booking Init
router.get('/init/:branchId', bookingController.getBookingInit);

router.post('/', bookingController.createBooking);
router.get('/', verifyAdmin, bookingController.getAllBookings);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', verifyAdmin, bookingController.updateBooking);
router.delete('/:id', verifyAdmin, bookingController.deleteBooking);
router.post('/delete-multiple', verifyAdmin, bookingController.deleteMultipleBookings);

export default router;
