const express = require('express');
const router = express.Router();
const { createHotel, updateHotel, deleteHotel, getHotels, getHotel, getDistricts } = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/districts', getDistricts);

router.route('/')
    .get(getHotels)
    .post(protect, authorize('Admin', 'Hotel Manager'), createHotel);

router.route('/:id')
    .get(getHotel)
    .put(protect, authorize('Admin', 'Hotel Manager'), updateHotel)
    .delete(protect, authorize('Admin', 'Hotel Manager'), deleteHotel);

module.exports = router;
