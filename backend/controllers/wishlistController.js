const Wishlist = require('../models/Wishlist');
const Hotel = require('../models/Hotel');

// @desc    Get all wishlist items for logged-in user
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const items = await Wishlist.find({ user: req.user._id })
            .populate({
                path: 'hotel',
                select: 'name city address images rating reviewCount cheapestPrice type starRating isApproved'
            })
            .sort({ createdAt: -1 });

        // Filter out any items where the hotel was deleted
        const validItems = items.filter(item => item.hotel !== null);
        res.json(validItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
    }
};

// @desc    Toggle hotel in wishlist (add if not present, remove if present)
// @route   POST /api/wishlist/toggle/:hotelId
// @access  Private
const toggleWishlist = async (req, res) => {
    try {
        const { hotelId } = req.params;

        // Verify hotel exists
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

        // Check if already in wishlist
        const existing = await Wishlist.findOne({ user: req.user._id, hotel: hotelId });

        if (existing) {
            // Remove from wishlist
            await Wishlist.findByIdAndDelete(existing._id);
            const count = await Wishlist.countDocuments({ user: req.user._id });
            return res.json({ saved: false, message: 'Removed from wishlist', count });
        } else {
            // Add to wishlist
            await Wishlist.create({ user: req.user._id, hotel: hotelId });
            const count = await Wishlist.countDocuments({ user: req.user._id });
            return res.json({ saved: true, message: 'Added to wishlist', count });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating wishlist', error: error.message });
    }
};

// @desc    Check if a specific hotel is in wishlist
// @route   GET /api/wishlist/check/:hotelId
// @access  Private
const checkWishlist = async (req, res) => {
    try {
        const existing = await Wishlist.findOne({ user: req.user._id, hotel: req.params.hotelId });
        res.json({ saved: !!existing });
    } catch (error) {
        res.status(500).json({ message: 'Error checking wishlist' });
    }
};

// @desc    Get wishlist count for navbar badge
// @route   GET /api/wishlist/count
// @access  Private
const getWishlistCount = async (req, res) => {
    try {
        const count = await Wishlist.countDocuments({ user: req.user._id });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wishlist count' });
    }
};

module.exports = { getWishlist, toggleWishlist, checkWishlist, getWishlistCount };
