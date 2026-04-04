const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    commissionPercentage: { type: Number, default: 10 },
    taxPercentage: { type: Number, default: 5 },
    currency: { type: String, default: 'INR' },
    platformName: { type: String, default: 'Elite Stays' },
    supportEmail: { type: String, default: 'support@elitestay.com' },
}, { timestamps: true });

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
