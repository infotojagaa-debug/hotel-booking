const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getManagerAnalytics,
    getManagerReports,
    getManagerReservations,
    updateBookingStatus,
    handleCancellation,
    getManagerHotels,
    createManagerHotel,
    updateManagerHotel,
    deleteManagerHotel,
    getManagerRooms,
    createManagerRoom,
    updateManagerRoom,
    deleteManagerRoom,
    blockDates,
    unblockDates,
    getManagerReviews,
    replyToReview,
    reportReview,
    getManagerOffers,
    createManagerOffer,
    updateManagerOffer,
    deleteManagerOffer,
    toggleOfferStatus,
    getManagerNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    updateManagerProfile,
    changeManagerPassword,
} = require('../controllers/managerController');

// All manager dashboard routes are protected
router.use(protect, authorize('manager', 'admin'));

// ── Analytics & Reports ────────────────────────────────────────────────────
router.get('/analytics', getManagerAnalytics);
router.get('/reports', getManagerReports);

// ── Bookings / Reservations ───────────────────────────────────────────────
router.get('/reservations', getManagerReservations);
router.put('/bookings/:id/status', updateBookingStatus);
router.put('/bookings/:id/cancellation', handleCancellation);

// ── Hotel Management ──────────────────────────────────────────────────────
router.get('/hotels', getManagerHotels);
router.post('/hotels', createManagerHotel);
router.put('/hotels/:id', updateManagerHotel);
router.delete('/hotels/:id', deleteManagerHotel);

// ── Room Management ───────────────────────────────────────────────────────
router.get('/rooms', getManagerRooms);
router.post('/rooms', createManagerRoom);
router.put('/rooms/:id', updateManagerRoom);
router.delete('/rooms/:id', deleteManagerRoom);

// ── Availability ──────────────────────────────────────────────────────────
router.put('/rooms/:id/block', blockDates);
router.put('/rooms/:id/unblock', unblockDates);

// ── Reviews ───────────────────────────────────────────────────────────────
router.get('/reviews', getManagerReviews);
router.put('/reviews/:id/reply', replyToReview);
router.put('/reviews/:id/report', reportReview);

// ── Offers / Coupons ──────────────────────────────────────────────────────
router.get('/offers', getManagerOffers);
router.post('/offers', createManagerOffer);
router.put('/offers/:id', updateManagerOffer);
router.delete('/offers/:id', deleteManagerOffer);
router.put('/offers/:id/toggle', toggleOfferStatus);

// ── Notifications ─────────────────────────────────────────────────────────
router.get('/notifications', getManagerNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);

// ── Profile ───────────────────────────────────────────────────────────────
router.put('/profile', updateManagerProfile);
router.put('/change-password', changeManagerPassword);

module.exports = router;
