const express = require('express');
const router = express.Router();
const { getPublicOffers, getHotelOffers, calculateDiscount, seedDefaultOffers } = require('../controllers/offerController');

router.get('/public', getPublicOffers);
router.get('/hotel/:hotelId', getHotelOffers);
router.get('/calculate', calculateDiscount);
router.post('/seed', seedDefaultOffers);

module.exports = router;
