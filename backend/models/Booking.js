const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    platformFee: { type: Number, default: 0 }, // Admin's cut
    managerEarnings: { type: Number, default: 0 }, // Manager's cut
    status: { type: String, default: 'Pending', enum: ['Pending', 'Confirmed', 'Cancelled', 'Checked-In', 'Checked-Out'] },
    paymentStatus: { type: String, default: 'Unpaid', enum: ['Unpaid', 'Paid', 'Refunded'] },
    paymentMethod: { type: String, required: true, enum: ['UPI', 'Card', 'Netbanking', 'Wallet', 'Pay at Hotel'] },
    paymentId: { type: String },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
