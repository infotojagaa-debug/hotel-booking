const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createReview, getHotelReviews, getAllReviews, deleteReview } = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/hotel/:hotelId', getHotelReviews);
router.get('/', protect, getAllReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;
