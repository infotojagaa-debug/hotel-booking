const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Review = require('../models/Review');
const Offer = require('../models/Offer');
const GlobalSettings = require('../models/GlobalSettings');
const Notification = require('../models/Notification');
const sendNotification = require('../utils/notify');

// @desc    Get platform analytics (Advanced for Recharts)
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = { paymentStatus: 'Paid' };
        
        if (startDate && endDate) {
            dateFilter.createdAt = { 
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)), 
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) 
            };
        }

        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalManagers = await User.countDocuments({ role: 'manager' });
        const totalHotels = await Hotel.countDocuments();
        const totalBookings = await Booking.countDocuments();
        
        // Financials (Filtered by date range if provided)
        const bookings = await Booking.find(dateFilter);
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        const platformEarnings = bookings.reduce((acc, booking) => acc + (booking.platformFee || 0), 0);
        const managerPayouts = bookings.reduce((acc, booking) => acc + (booking.managerEarnings || 0), 0);

        // Chart Data: Last 7 days revenue (Always 7 days for the chart trend, regardless of filter)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            
            const dayBookings = await Booking.find({
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                paymentStatus: 'Paid'
            });
            
            last7Days.push({
                date: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dayBookings.reduce((acc, b) => acc + b.totalPrice, 0),
                earnings: dayBookings.reduce((acc, b) => acc + (b.platformFee || 0), 0)
            });
        }

        const recentBookings = await Booking.find()
            .populate('user', 'name email')
            .populate('room', 'name')
            .sort({ createdAt: -1 })
            .limit(8);

        // Daily Earnings logic (Today specifically)
        const today = new Date();
        const tStart = new Date(today.setHours(0, 0, 0, 0));
        const tEnd = new Date(today.setHours(23, 59, 59, 999));
        const tBookings = await Booking.find({
            createdAt: { $gte: tStart, $lte: tEnd },
            paymentStatus: 'Paid'
        });
        const dailyEarnings = tBookings.reduce((acc, b) => acc + (b.platformFee || 0), 0);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStart = new Date(yesterday.setHours(0, 0, 0, 0));
        const yEnd = new Date(yesterday.setHours(23, 59, 59, 999));
        const yBookings = await Booking.find({
            createdAt: { $gte: yStart, $lte: yEnd },
            paymentStatus: 'Paid'
        });
        const yesterdayEarnings = yBookings.reduce((acc, b) => acc + (b.platformFee || 0), 0);

        res.json({ 
            totalUsers, totalManagers, totalHotels, totalBookings, 
            totalRevenue, platformEarnings, managerPayouts, yesterdayEarnings,
            dailyEarnings,
            chartData: last7Days,
            recentBookings 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching analytics', error: error.message });
    }
};

// @desc    Get all managers (including pending)
// @route   GET /api/admin/managers
// @access  Private/Admin
const getManagers = async (req, res) => {
    try {
        const managers = await User.find({ role: 'manager' }).select('-password').sort({ createdAt: -1 });
        res.json(managers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching managers' });
    }
};

// @desc    Approve/Block Manager
// @route   PUT /api/admin/managers/:id/status
// @access  Private/Admin
const updateManagerStatus = async (req, res) => {
    try {
        const { isApproved, isSuspended } = req.body;
        const manager = await User.findById(req.params.id);
        if (!manager) return res.status(404).json({ message: 'Manager not found' });
        
        if (typeof isApproved !== 'undefined') manager.isApproved = isApproved;
        if (typeof isSuspended !== 'undefined') manager.isSuspended = isSuspended;
        
        await manager.save();

        // Notify manager
        if (isApproved) {
            await sendNotification(
                manager._id,
                'manager',
                'system',
                'Your account has been approved! You can now login and manage your hotels.'
            );
        } else if (isSuspended) {
            await sendNotification(
                manager._id,
                'manager',
                'system',
                'Your account has been suspended. Please contact support.'
            );
        }

        res.json({ message: 'Manager status updated', manager });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update manager status' });
    }
};

// @desc    Get all rooms (Platform wide), optionally filtered by hotel
// @route   GET /api/admin/rooms?hotelId=<id>
// @access  Private/Admin
const getAdminRooms = async (req, res) => {
    try {
        const query = req.query.hotelId ? { hotel: req.query.hotelId } : {};
        const rooms = await Room.find(query).populate('hotel', 'name city');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
};

// @desc    Get rooms for a SPECIFIC hotel (strict isolation)
// @route   GET /api/admin/hotels/:hotelId/rooms
// @access  Private/Admin
const getHotelRooms = async (req, res) => {
    try {
        const { hotelId } = req.params;
        if (!hotelId) {
            return res.status(400).json({ message: 'hotelId is required' });
        }
        // Strict filter: only return rooms that belong to this exact hotel
        const rooms = await Room.find({ hotel: hotelId })
            .populate('hotel', 'name city')
            .sort({ createdAt: -1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hotel rooms' });
    }
};

// @desc    Update Booking Status (Confirmed/Cancelled/Completed)
// @route   PUT /api/admin/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        booking.status = status;
        await booking.save();

        // Notify User in real-time
        await sendNotification(
            booking.user,
            'customer',
            status === 'Cancelled' ? 'system' : 'booking',
            `Your booking status for ${booking.room ? 'your room' : 'stay'} has been updated to ${status}.`,
            booking._id
        );

        res.json({ message: 'Booking status updated', booking });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update booking' });
    }
};

// @desc    Manage Global Settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne();
        if (!settings) settings = await GlobalSettings.create({});
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const settings = await GlobalSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
};

// @desc    Promotions & Offers
const getOffers = async (req, res) => {
    try {
        const offers = await Offer.find()
            .populate('hotel', 'name city')
            .sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offers' });
    }
};

const createOffer = async (req, res) => {
    try {
        const { hotel, ...rest } = req.body;
        // hotel = null/empty → Global promotion; hotel = id → Hotel-specific
        const offerData = {
            ...rest,
            hotel: hotel || null,
            offerType: hotel ? 'Hotel' : 'Platform',
        };
        const offer = await Offer.create(offerData);
        const populated = await Offer.findById(offer._id).populate('hotel', 'name city');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateOffer = async (req, res) => {
    try {
        const { hotel, ...rest } = req.body;
        const offerData = {
            ...rest,
            hotel: hotel || null,
            offerType: hotel ? 'Hotel' : 'Platform',
        };
        const offer = await Offer.findByIdAndUpdate(req.params.id, offerData, { new: true })
            .populate('hotel', 'name city');
        if (!offer) return res.status(404).json({ message: 'Offer not found' });
        res.json(offer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteOffer = async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete offer' });
    }
};

module.exports = {
    getAnalytics,
    getManagers,
    updateManagerStatus,
    getAdminRooms,
    getHotelRooms,
    updateBookingStatus,
    getSettings,
    updateSettings,
    getOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    // Re-exporting existing if needed or replacing
    getAdminHotels: async (req, res) => {
        const hotels = await Hotel.find().populate('managerId', 'name email');
        res.json(hotels);
    },
    approveHotel: async (req, res) => {
        const { isApproved, commissionPercentage } = req.body;
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, { isApproved, commissionPercentage }, { new: true });
        
        if (isApproved && (hotel.manager || hotel.managerId)) {
            await sendNotification(
                hotel.manager || hotel.managerId,
                'manager',
                'hotel',
                `Great news! Your hotel "${hotel.name || 'property'}" has been approved by our team.`,
                hotel._id
            );
        }
        res.json(hotel);
    },
    createAdminHotel: async (req, res) => {
        try {
            const hotel = await Hotel.create({
                ...req.body,
                managerId: req.user._id,   // Admin is the managerId
                isAdminHotel: true,
                isApproved: true,
            });
            res.status(201).json(hotel);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    deleteAdminHotel: async (req, res) => {
        try {
            await Hotel.findByIdAndDelete(req.params.id);
            await Room.deleteMany({ hotel: req.params.id });
            res.json({ message: 'Hotel and associated rooms deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete hotel' });
        }
    },
    getUsers: async (req, res) => {
        const users = await User.find({ role: 'customer' }).select('-password');
        res.json(users);
    },
    suspendUser: async (req, res) => {
        const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: req.body.isSuspended }, { new: true });
        res.json(user);
    },
    getBookings: async (req, res) => {
        const bookings = await Booking.find().populate('user', 'name email').populate('room', 'name pricePerNight').sort({ createdAt: -1 });
        res.json(bookings);
    }
};
