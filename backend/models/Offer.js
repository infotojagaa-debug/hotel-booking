const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    code: { type: String, required: true },  // uniqueness enforced per-hotel via compound index
    title: { type: String, required: true },
    description: { type: String, required: true },
    discountType: { type: String, enum: ['Percentage', 'Flat'], default: 'Percentage' },
    discountValue: { type: Number, required: true },
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    minBookingAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // cap for percentage discounts
    // Scope: Platform/Global vs single Hotel
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    offerType: { type: String, enum: ['Platform', 'Hotel', 'Seasonal'], default: 'Platform' },
    bannerImage: { type: String, default: '' } // URL for image banner
}, { timestamps: true });

// Unique code per hotel scope: same code can't repeat for same hotel,
// but the same code CAN exist globally AND for a specific hotel.
offerSchema.index({ code: 1, hotel: 1 }, { unique: true, sparse: false });

module.exports = mongoose.model('Offer', offerSchema);
