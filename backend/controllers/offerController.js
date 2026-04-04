const Offer = require('../models/Offer');

// @desc    Get active public offers for the landing page (no auth required)
// @route   GET /api/offers/public
// @access  Public
const getPublicOffers = async (req, res) => {
    try {
        const currentDate = new Date();
        const offers = await Offer.find({
            isActive: true,
            validFrom: { $lte: currentDate },
            validTo: { $gte: currentDate },
        })
        .populate('hotel', 'name images city')
        .sort({ discountValue: -1 })
        .limit(10);
        
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active offers', error: error.message });
    }
};

// @desc    Get active offers for a specific hotel (global + hotel-specific)
// @route   GET /api/offers/hotel/:hotelId
// @access  Public
const getHotelOffers = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const currentDate = new Date();
        const offers = await Offer.find({
            isActive: true,
            validFrom: { $lte: currentDate },
            validTo: { $gte: currentDate },
            $or: [
                { hotel: hotelId },   // hotel-specific
                { hotel: null },      // global/platform offers
            ]
        })
        .populate('hotel', 'name city')
        .sort({ discountValue: -1 });
        
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hotel offers', error: error.message });
    }
};

// @desc    Calculate best discount for a hotel booking
// @route   GET /api/offers/calculate?hotelId=X&amount=Y
// @access  Public
const calculateDiscount = async (req, res) => {
    try {
        const { hotelId, amount } = req.query;
        if (!hotelId || !amount) {
            return res.status(400).json({ message: 'hotelId and amount are required' });
        }
        const totalAmount = parseFloat(amount);
        const currentDate = new Date();

        const offers = await Offer.find({
            isActive: true,
            validFrom: { $lte: currentDate },
            validTo: { $gte: currentDate },
            $or: [
                { hotel: hotelId },
                { hotel: null },
            ]
        })
        .populate('hotel', 'name city')
        .sort({ discountValue: -1 });

        // Filter by minimum booking amount
        const eligible = offers.filter(o => !o.minBookingAmount || totalAmount >= o.minBookingAmount);

        if (eligible.length === 0) {
            return res.json({ offer: null, discount: 0, finalAmount: totalAmount });
        }

        // Find best discount
        let bestOffer = null;
        let bestDiscount = 0;
        for (const o of eligible) {
            let discount = 0;
            if (o.discountType === 'Percentage') {
                discount = totalAmount * (o.discountValue / 100);
                // Apply cap if set
                if (o.maxDiscount > 0) discount = Math.min(discount, o.maxDiscount);
            } else {
                discount = o.discountValue;
            }
            if (discount > bestDiscount) {
                bestDiscount = discount;
                bestOffer = o;
            }
        }

        res.json({
            offer: bestOffer,
            discount: Math.round(bestDiscount),
            finalAmount: Math.round(totalAmount - bestDiscount),
            allOffers: eligible,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error calculating discount', error: error.message });
    }
};

// @desc    Seed default dummy offers (run once, idempotent via code field)
// @route   POST /api/offers/seed
// @access  Public (dev only — safe because it uses upsert)
const seedDefaultOffers = async (req, res) => {
    try {
        const validTo = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
        const validFrom = new Date();

        // Fix: Only seed if the database is completely empty
        const count = await Offer.countDocuments();
        if (count > 0) {
            return res.json({ message: 'Offers already exist in the database. Skipping auto-seed.' });
        }

        const defaults = [
            {
                code: 'BEACH20',
                title: 'Flat 20% OFF on Beach Hotels',
                description: 'Enjoy sun, sand and savings! Get 20% off on all beachside properties.',
                discountType: 'Percentage',
                discountValue: 20,
                offerType: 'Platform',
                hotel: null,
                bannerImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
                validFrom, validTo, isActive: true,
            },
            {
                code: 'FIRST1000',
                title: '₹1000 OFF on First Booking',
                description: 'New to EliteStays? Get flat ₹1000 off on your very first hotel booking.',
                discountType: 'Flat',
                discountValue: 1000,
                offerType: 'Platform',
                hotel: null,
                bannerImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
                validFrom, validTo, isActive: true,
            },
            {
                code: 'LUXURY30',
                title: 'Luxury Rooms at 30% Discount',
                description: 'Upgrade your stay! Premium suites at 30% off for a limited time.',
                discountType: 'Percentage',
                discountValue: 30,
                offerType: 'Platform',
                hotel: null,
                bannerImage: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
                validFrom, validTo, isActive: true,
            },
            {
                code: 'WEEKEND25',
                title: 'Weekend Getaway – 25% OFF',
                description: 'Book Friday–Sunday stays and save 25% automatically.',
                discountType: 'Percentage',
                discountValue: 25,
                offerType: 'Platform',
                hotel: null,
                bannerImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
                validFrom, validTo, isActive: true,
            },
            {
                code: 'EARLYBIRD15',
                title: 'Early Bird Special – 15% OFF',
                description: 'Book 7+ days in advance and enjoy an exclusive 15% early bird discount.',
                discountType: 'Percentage',
                discountValue: 15,
                offerType: 'Platform',
                hotel: null,
                bannerImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe2fa?w=600&q=80',
                validFrom, validTo, isActive: true,
            },
        ];

        let created = 0;
        for (const offer of defaults) {
            const exists = await Offer.findOne({ code: offer.code });
            if (!exists) {
                await Offer.create(offer);
                created++;
            }
        }

        res.json({ message: `Seeded ${created} new offer(s). ${defaults.length - created} already existed.` });
    } catch (error) {
        res.status(500).json({ message: 'Seed failed', error: error.message });
    }
};

module.exports = { getPublicOffers, getHotelOffers, calculateDiscount, seedDefaultOffers };
