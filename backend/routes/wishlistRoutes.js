const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getWishlist, toggleWishlist, checkWishlist, getWishlistCount } = require('../controllers/wishlistController');

// All wishlist routes require authentication
router.use(protect);

router.get('/', getWishlist);
router.get('/count', getWishlistCount);
router.get('/check/:hotelId', checkWishlist);
router.post('/toggle/:hotelId', toggleWishlist);

module.exports = router;
