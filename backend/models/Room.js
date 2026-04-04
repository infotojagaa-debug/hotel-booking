const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    amenities: [{ type: String }],
    maxGuests: { type: Number, required: true },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },
    roomNumbers: [{ number: Number, unavailableDates: { type: [Date] } }],
    // Availability & Pricing
    blockedDates: [{ type: Date }],
    weekendPriceMultiplier: { type: Number, default: 1.0 }, // e.g. 1.3 = 30% more on weekends
    festivalPrices: [{
        label: { type: String },
        date: { type: Date },
        price: { type: Number }
    }],
    totalRoomCount: { type: Number, default: 1 },
    isPredefined: { type: Boolean, default: false }, // Hide bootstrap/seed data
    status: { type: String, enum: ['Available', 'Maintenance', 'Blocked'], default: 'Available' }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
