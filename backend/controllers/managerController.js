const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Review = require('../models/Review');
const Offer = require('../models/Offer');
const Notification = require('../models/Notification');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ─── Helper: get all hotels owned by manager ───────────────────────────────
const getManagerHotelIds = async (managerId) => {
    const hotels = await Hotel.find({ managerId: managerId });
    return hotels.map(h => h._id);
};

// ─── 1. ANALYTICS / DASHBOARD OVERVIEW ────────────────────────────────────
const getManagerAnalytics = async (req, res) => {
    try {
        const hotels = await Hotel.find({ managerId: req.user._id });
        const hotelIds = hotels.map(h => h._id);
        const rooms = await Room.find({ hotel: { $in: hotelIds } });
        const roomIds = rooms.map(r => r._id);
        const bookings = await Booking.find({ room: { $in: roomIds } });

        const totalBookings = bookings.length;
        const paidBookings = bookings.filter(b => b.paymentStatus === 'Paid');
        const totalRevenue = paidBookings.reduce((s, b) => s + b.totalPrice, 0);
        const netEarnings = paidBookings.reduce((s, b) => s + (b.managerEarnings || 0), 0);
        const platformFees = paidBookings.reduce((s, b) => s + (b.platformFee || 0), 0);

        // Chart: last 30 days revenue
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(new Date(startOfDay).setHours(23, 59, 59, 999));
            const dayBookings = paidBookings.filter(b => {
                const created = new Date(b.createdAt);
                return created >= startOfDay && created <= endOfDay;
            });
            last30Days.push({
                date: startOfDay.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                revenue: dayBookings.reduce((s, b) => s + b.totalPrice, 0),
                earnings: dayBookings.reduce((s, b) => s + (b.managerEarnings || 0), 0),
                bookings: dayBookings.length,
            });
        }

        // Occupancy: rooms with active bookings today
        const today = new Date();
        const occupiedRooms = bookings.filter(b => {
            return new Date(b.checkInDate) <= today && new Date(b.checkOutDate) >= today && b.status === 'Checked-In';
        }).length;
        const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

        // Status breakdown
        const statusBreakdown = {
            Confirmed: bookings.filter(b => b.status === 'Confirmed').length,
            Pending: bookings.filter(b => b.status === 'Pending').length,
            Cancelled: bookings.filter(b => b.status === 'Cancelled').length,
            'Checked-In': bookings.filter(b => b.status === 'Checked-In').length,
            'Checked-Out': bookings.filter(b => b.status === 'Checked-Out').length,
        };

        // Most booked rooms (top 5)
        const roomBookingCount = {};
        bookings.forEach(b => {
            const rId = b.room?.toString();
            if (rId) roomBookingCount[rId] = (roomBookingCount[rId] || 0) + 1;
        });

        res.json({
            totalHotels: hotels.length,
            totalRooms: rooms.length,
            totalBookings,
            totalRevenue,
            netEarnings,
            platformFees,
            occupancyRate,
            statusBreakdown,
            chartData: last30Days,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching analytics', error: error.message });
    }
};

// ─── 2. DETAILED REPORTS (monthly) ────────────────────────────────────────
const getManagerReports = async (req, res) => {
    try {
        const hotelIds = await getManagerHotelIds(req.user._id);
        const rooms = await Room.find({ hotel: { $in: hotelIds } });
        const roomIds = rooms.map(r => r._id);
        const bookings = await Booking.find({ room: { $in: roomIds }, paymentStatus: 'Paid' });

        // Monthly revenue chart (last 12 months)
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth();
            const monthBookings = bookings.filter(b => {
                const c = new Date(b.createdAt);
                return c.getFullYear() === year && c.getMonth() === month;
            });
            monthlyData.push({
                month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
                revenue: monthBookings.reduce((s, b) => s + b.totalPrice, 0),
                earnings: monthBookings.reduce((s, b) => s + (b.managerEarnings || 0), 0),
                bookings: monthBookings.length,
            });
        }

        // Most booked rooms
        const roomBookingMap = {};
        bookings.forEach(b => {
            const rId = b.room?.toString();
            if (rId) roomBookingMap[rId] = (roomBookingMap[rId] || 0) + 1;
        });
        const topRooms = rooms
            .map(r => ({ ...r.toObject(), bookingCount: roomBookingMap[r._id.toString()] || 0 }))
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 5);

        res.json({ monthlyData, topRooms });
    } catch (error) {
        res.status(500).json({ message: 'Report generation failed', error: error.message });
    }
};

// ─── 3. RESERVATIONS ───────────────────────────────────────────────────────
const getManagerReservations = async (req, res) => {
    try {
        const hotels = await Hotel.find({ managerId: req.user._id });
        const hotelIds = hotels.map(h => h._id);
        const rooms = await Room.find({ hotel: { $in: hotelIds } });
        const roomIds = rooms.map(r => r._id);

        const bookings = await Booking.find({ room: { $in: roomIds } })
            .populate('user', 'name email phone')
            .populate({
                path: 'room',
                select: 'name type pricePerNight hotel',
                populate: { path: 'hotel', select: 'name city' }
            })
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching manager reservations', error: error.message });
    }
};

// ─── 4. UPDATE BOOKING STATUS ─────────────────────────────────────────────
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = status;
        await booking.save();

        // Notify user
        await Notification.create({
            user: booking.user,
            message: `Your booking status has been updated to "${status}".`,
            type: status === 'Cancelled' ? 'Alert' : 'Info'
        });

        res.json({ message: 'Booking status updated', booking });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update booking status' });
    }
};

// ─── 5. HANDLE CANCELLATION ───────────────────────────────────────────────
const handleCancellation = async (req, res) => {
    try {
        const { action, refundPolicy } = req.body; // action: 'approve' | 'reject'
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (action === 'approve') {
            booking.status = 'Cancelled';
            if (refundPolicy === 'full') {
                booking.paymentStatus = 'Refunded';
            } else if (refundPolicy === 'partial') {
                booking.paymentStatus = 'Refunded'; // In production, partial logic applies
            }
            await Notification.create({
                user: booking.user,
                message: `Your cancellation request has been approved. Refund policy: ${refundPolicy || 'standard'}.`,
                type: 'Info'
            });
        } else {
            booking.status = 'Confirmed';
            await Notification.create({
                user: booking.user,
                message: 'Your cancellation request was rejected by the hotel. Your booking remains active.',
                type: 'Warning'
            });
        }
        await booking.save();
        res.json({ message: `Cancellation ${action}d`, booking });
    } catch (error) {
        res.status(500).json({ message: 'Failed to process cancellation' });
    }
};

// ─── 6. HOTEL CRUD ────────────────────────────────────────────────────────
const getManagerHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find({ managerId: req.user._id }).sort({ createdAt: -1 });
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hotels' });
    }
};

const createManagerHotel = async (req, res) => {
    try {
        const hotel = await Hotel.create({
            ...req.body,
            managerId: req.user._id,
            isApproved: false, // Requires admin approval
        });
        // Notify admin (we can use a special admin notification or just log)
        res.status(201).json(hotel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateManagerHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ _id: req.params.id, managerId: req.user._id });
        if (!hotel) return res.status(404).json({ message: 'Hotel not found or not authorized' });

        const updated = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteManagerHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ _id: req.params.id, managerId: req.user._id });
        if (!hotel) return res.status(404).json({ message: 'Hotel not found or not authorized' });

        await Hotel.findByIdAndDelete(req.params.id);
        await Room.deleteMany({ hotel: req.params.id });
        res.json({ message: 'Hotel deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete hotel' });
    }
};

// ─── 7. ROOM CRUD ─────────────────────────────────────────────────────────
const getManagerRooms = async (req, res) => {
    try {
        const { hotelId } = req.query;
        const hotelIds = await getManagerHotelIds(req.user._id);
        const query = hotelId ? { hotel: hotelId } : { hotel: { $in: hotelIds } };
        const rooms = await Room.find(query).populate('hotel', 'name city');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
};

const createManagerRoom = async (req, res) => {
    try {
        const { hotelId } = req.body;
        // Verify hotel belongs to this managerId
        const hotel = await Hotel.findOne({ _id: hotelId, managerId: req.user._id });
        if (!hotel) return res.status(403).json({ message: 'Not authorized to add rooms to this hotel' });

        const room = await Room.create({ ...req.body, hotel: hotelId });
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateManagerRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('hotel');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (room.hotel.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const updated = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteManagerRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('hotel');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (room.hotel.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Room.findByIdAndDelete(req.params.id);
        res.json({ message: 'Room deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete room' });
    }
};

// ─── 8. AVAILABILITY: BLOCK / UNBLOCK DATES ───────────────────────────────
const blockDates = async (req, res) => {
    try {
        const { dates } = req.body; // array of date strings
        const room = await Room.findById(req.params.id).populate('hotel');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (room.hotel.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const newDates = dates.map(d => new Date(d));
        room.blockedDates = [...new Set([...room.blockedDates.map(d => d.toISOString()), ...newDates.map(d => d.toISOString())])].map(d => new Date(d));
        await room.save();
        res.json({ message: 'Dates blocked', blockedDates: room.blockedDates });
    } catch (error) {
        res.status(500).json({ message: 'Failed to block dates' });
    }
};

const unblockDates = async (req, res) => {
    try {
        const { dates } = req.body;
        const room = await Room.findById(req.params.id).populate('hotel');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (room.hotel.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const toRemove = new Set(dates.map(d => new Date(d).toDateString()));
        room.blockedDates = room.blockedDates.filter(d => !toRemove.has(new Date(d).toDateString()));
        await room.save();
        res.json({ message: 'Dates unblocked', blockedDates: room.blockedDates });
    } catch (error) {
        res.status(500).json({ message: 'Failed to unblock dates' });
    }
};

// ─── 9. REVIEWS ───────────────────────────────────────────────────────────
const getManagerReviews = async (req, res) => {
    try {
        const hotelIds = await getManagerHotelIds(req.user._id);
        const reviews = await Review.find({ hotel: { $in: hotelIds } })
            .populate('user', 'name email')
            .populate('hotel', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};

const replyToReview = async (req, res) => {
    try {
        const { text } = req.body;
        const review = await Review.findById(req.params.id).populate('hotel');
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (review.hotel.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        review.managerReply = { text, repliedAt: new Date() };
        await review.save();
        res.json({ message: 'Reply posted', review });
    } catch (error) {
        res.status(500).json({ message: 'Failed to post reply' });
    }
};

const reportReview = async (req, res) => {
    try {
        const { reason } = req.body;
        const review = await Review.findById(req.params.id).populate('hotel');
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (review.hotel.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        review.isReported = true;
        review.reportReason = reason || 'Flagged as inappropriate';
        await review.save();
        res.json({ message: 'Review reported for admin review', review });
    } catch (error) {
        res.status(500).json({ message: 'Failed to report review' });
    }
};

// ─── 10. OFFERS / COUPONS ─────────────────────────────────────────────────
const getManagerOffers = async (req, res) => {
    try {
        const hotelIds = await getManagerHotelIds(req.user._id);
        // Return offers tied to this manager's hotels
        const offers = await Offer.find({ hotel: { $in: hotelIds } })
            .populate('hotel', 'name city')
            .sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offers' });
    }
};

const createManagerOffer = async (req, res) => {
    try {
        // Auto-assign hotel from manager's primary property — never trust body.hotel
        const primaryHotel = await Hotel.findOne({ managerId: req.user._id });
        if (!primaryHotel) {
            return res.status(403).json({ message: 'No hotel found for your account. Please add a property first.' });
        }

        const { hotel: _ignored, manager: _m, offerType: _t, ...safeFields } = req.body;

        // Check duplicate code within this hotel's scope
        const existing = await Offer.findOne({ code: safeFields.code?.toUpperCase(), hotel: primaryHotel._id });
        if (existing) {
            return res.status(400).json({ message: `Code "${safeFields.code}" already exists for ${primaryHotel.name}. Use a different code.` });
        }

        const offer = await Offer.create({
            ...safeFields,
            code: safeFields.code?.toUpperCase(),
            hotel: primaryHotel._id,
            manager: req.user._id,
            offerType: 'Hotel',
        });
        const populated = await Offer.findById(offer._id).populate('hotel', 'name city');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateManagerOffer = async (req, res) => {
    try {
        // Find the offer and verify ownership via hotel
        const offer = await Offer.findById(req.params.id).populate('hotel');
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        // Ensure the offer's hotel belongs to this manager
        if (!offer.hotel || offer.hotel.managerId?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this offer.' });
        }

        // Never overwrite hotel, manager, or offerType
        const { hotel: _h, manager: _m, offerType: _t, ...safeFields } = req.body;

        const updated = await Offer.findByIdAndUpdate(
            req.params.id,
            { ...safeFields, code: safeFields.code?.toUpperCase() },
            { new: true }
        ).populate('hotel', 'name city');

        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteManagerOffer = async (req, res) => {
    try {
        const offer = await Offer.findOne({ _id: req.params.id, manager: req.user._id });
        if (!offer) return res.status(404).json({ message: 'Offer not found or not authorized' });
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete offer' });
    }
};

const toggleOfferStatus = async (req, res) => {
    try {
        const offer = await Offer.findOne({ _id: req.params.id, manager: req.user._id });
        if (!offer) return res.status(404).json({ message: 'Not found' });
        offer.isActive = !offer.isActive;
        await offer.save();
        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle offer' });
    }
};

// ─── 11. NOTIFICATIONS ────────────────────────────────────────────────────
const getManagerNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update notification' });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update notifications' });
    }
};

// ─── 12. PROFILE MANAGEMENT ───────────────────────────────────────────────
const updateManagerProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        await user.save();

        res.json({ message: 'Profile updated', user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const changeManagerPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getManagerAnalytics,
    getManagerReports,
    getManagerReservations,
    updateBookingStatus,
    handleCancellation,
    getManagerHotels,
    createManagerHotel,
    updateManagerHotel,
    deleteManagerHotel,
    getManagerRooms,
    createManagerRoom,
    updateManagerRoom,
    deleteManagerRoom,
    blockDates,
    unblockDates,
    getManagerReviews,
    replyToReview,
    reportReview,
    getManagerOffers,
    createManagerOffer,
    updateManagerOffer,
    deleteManagerOffer,
    toggleOfferStatus,
    getManagerNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    updateManagerProfile,
    changeManagerPassword,
};
