const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    }
}, { timestamps: true });

// Ensure a user can only save the same hotel once
wishlistSchema.index({ user: 1, hotel: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
