const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBookings, getBookingById, downloadInvoice } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');
 
router.route('/').get(protect, authorize('Admin', 'Hotel Manager'), getBookings).post(protect, createBooking);
router.route('/mybookings').get(protect, getMyBookings);
router.route('/:id/invoice').get(protect, downloadInvoice);
router.route('/:id').get(protect, getBookingById);

module.exports = router;
