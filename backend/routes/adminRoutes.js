const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAnalytics,
    getAdminHotels,
    approveHotel,
    createAdminHotel,
    suspendUser,
    getUsers,
    getBookings,
    getManagers,
    updateManagerStatus,
    getAdminRooms,
    getHotelRooms,
    updateBookingStatus,
    getSettings,
    updateSettings,
    getOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    deleteAdminHotel
} = require('../controllers/adminController');

// All admin routes are protected and require the 'admin' role
router.use(protect, authorize('admin'));

// Platform Analytics
router.get('/analytics', getAnalytics);

// User & Manager Control
router.get('/users', getUsers);
router.put('/users/:id/suspend', suspendUser);
router.get('/managers', getManagers);
router.post('/managers', async (req, res) => {
    try {
        const User = require('../models/User');
        const bcrypt = require('bcryptjs');
        const { name, email, password, phone } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already registered' });
        const hashed = await bcrypt.hash(password, 10);
        const manager = await User.create({ name, email, password: hashed, phone, role: 'manager', isApproved: true });
        res.status(201).json(manager);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.put('/managers/:id/status', updateManagerStatus);

// Property & Room Control
router.get('/hotels', getAdminHotels);
router.post('/hotels', createAdminHotel);
router.put('/hotels/:id/approve', approveHotel);
router.delete('/hotels/:id', deleteAdminHotel);
router.get('/rooms', getAdminRooms);

// Hotel-specific room management (strict isolation - key fix)
router.get('/hotels/:hotelId/rooms', getHotelRooms);
router.post('/hotels/:hotelId/rooms', async (req, res) => {
    try {
        const Room = require('../models/Room');
        const Hotel = require('../models/Hotel');
        const { hotelId } = req.params;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
        const roomNumbersArr = req.body.roomNumbers
            ? req.body.roomNumbers.split(',').map(n => ({ number: parseInt(n.trim()), unavailableDates: [] }))
            : [];
        const room = await Room.create({
            ...req.body,
            hotel: hotelId,
            roomNumbers: req.body.roomNumbers ? roomNumbersArr : req.body.roomNumbers,
        });
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Booking & Transaction Control
router.get('/bookings', getBookings);
router.put('/bookings/:id/status', updateBookingStatus);

// Platform Settings & Global Rules
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Promotions & Offers
router.get('/offers', getOffers);
router.post('/offers', createOffer);
router.put('/offers/:id', updateOffer);
router.delete('/offers/:id', deleteOffer);

module.exports = router;
