const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        const { hotelId, bookingId, rating, comment } = req.body;

        // 1. Verify the booking belongs to the user and is paid
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to review this booking' });
        }

        if (booking.paymentStatus !== 'Paid') {
            return res.status(400).json({ message: 'You can only review paid bookings' });
        }

        // 2. Check if already reviewed
        const alreadyReviewed = await Review.findOne({ booking: bookingId });
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Booking already reviewed' });
        }

        const review = await Review.create({
            user: req.user._id,
            hotel: hotelId,
            booking: bookingId,
            rating,
            comment
        });

        // 3. Update Hotel Rating and ReviewCount
        const hotel = await Hotel.findById(hotelId);
        const allReviews = await Review.find({ hotel: hotelId });
        hotel.reviewCount = allReviews.length;
        hotel.rating = allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;
        await hotel.save();

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Failed to submit review', error: error.message });
    }
};

// @desc    Get reviews for a hotel
// @route   GET /api/reviews/hotel/:hotelId
// @access  Public
const getHotelReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ hotel: req.params.hotelId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews
// @access  Private/Admin
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name')
            .populate('hotel', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        // Update hotel stats before deleting
        const hotel = await Hotel.findById(review.hotel);
        if (hotel) {
            const otherReviews = await Review.find({ hotel: hotel._id, _id: { $ne: review._id } });
            hotel.reviewCount = otherReviews.length;
            hotel.rating = otherReviews.length > 0 
                ? otherReviews.reduce((acc, item) => item.rating + acc, 0) / otherReviews.length 
                : 0;
            await hotel.save();
        }

        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete review' });
    }
};

module.exports = { createReview, getHotelReviews, getAllReviews, deleteReview };
