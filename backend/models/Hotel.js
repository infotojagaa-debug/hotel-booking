const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['Hotel', 'Apartment', 'Resort', 'Villa', 'Hostel', 'Guest House'] },
    city: { type: String, required: true },
    district: { type: String, default: '' },
    state: { type: String, default: 'Tamil Nadu' },
    address: { type: String, required: true },
    zipCode: { type: String, default: '' },
    locationHint: { type: String, default: '' },
    distanceFromCenter: { type: String, required: true },
    distanceFromBeach: { type: String, default: '' },
    isBreakfastIncluded: { type: Boolean, default: false },
    description: { type: String, required: true },
    images: [{ type: String }],
    cheapestPrice: { type: Number, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    amenities: { type: [String], default: [] },
    extraServices: [{
        name: { type: String },
        price: { type: Number, default: 0 },
        icon: { type: String }
    }],
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    featured: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }, // Admin approval flag
    isAdminHotel: { type: Boolean, default: false }, // Flag for hotel added by admin
    isPredefined: { type: Boolean, default: false }, // Hide bootstrap/seed data
    commissionPercentage: { type: Number, default: 10 }, // Platform commission rate
    policies: {
        checkInTime: { type: String, default: '14:00' },
        checkOutTime: { type: String, default: '11:00' },
        cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in' }
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

const Hotel = mongoose.model('Hotel', hotelSchema);
module.exports = Hotel;
