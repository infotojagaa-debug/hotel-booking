const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Private/Manager,Admin
const createHotel = async (req, res) => {
    try {
        const hotel = new Hotel({
            ...req.body,
            manager: req.user._id,
            isAdminHotel: req.user.role === 'Admin',
            isApproved: true // Auto-approve all properties for immediate project visibility
        });
        const savedHotel = await hotel.save();
        res.status(201).json(savedHotel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private/Manager,Admin
const updateHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

        // Check if user is manager or admin
        if (hotel.manager.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedHotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(updatedHotel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Manager,Admin
const deleteHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

        if (hotel.manager.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await Hotel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Hotel has been deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get all hotels with advanced filtering
// @route   GET /api/hotels
// @access  Public
const getHotels = async (req, res) => {
    const { 
        location, 
        minPrice, 
        maxPrice, 
        starRating, 
        amenities, 
        type,
        sort, 
        limit 
    } = req.query;

    try {
        let query = {};

        // 1. Basic & Security Filters
        if (location) {
            // Trim and enforce case-insensitive exact matching across City, District, or State
            const strictLoc = location.trim();
            query.$or = [
                { city: { $regex: `^${strictLoc}$`, $options: 'i' } },
                { district: { $regex: `^${strictLoc}$`, $options: 'i' } },
                { state: { $regex: `^${strictLoc}$`, $options: 'i' } }
            ];
        }
        if (starRating) query.starRating = { $gte: Number(starRating) };
        if (type) {
            // Support comma-separated types or single type
            const typeList = type.split(',');
            query.type = { $in: typeList.map(t => new RegExp(`^${t.trim()}$`, 'i')) };
        }
        if (req.query.manager) query.managerId = req.query.manager;
        
        // Hide predefined seed data from main results
        query.isPredefined = { $ne: true };
        
        // Public users only see approved hotels. 
        // Admin or Manager viewing their own can see pending.
        if (!req.query.manager && !req.query.adminView) {
            query.isApproved = true;
        }
        
        // 2. Price Range
        if (minPrice || maxPrice) {
            query.cheapestPrice = {};
            if (minPrice) query.cheapestPrice.$gte = Number(minPrice);
            if (maxPrice) query.cheapestPrice.$lte = Number(maxPrice);
        }

        // 3. Amenities (Array contains all)
        if (amenities) {
            const amenitiesList = amenities.split(',');
            query.amenities = { $all: amenitiesList };
        }

        let result = Hotel.find(query);
        // console.log("FINAL MONGO QUERY:", JSON.stringify(query, null, 2));

        // 4. Sorting
        if (sort === 'price_asc') {
            result = result.sort('cheapestPrice');
        } else if (sort === 'price_desc') {
            result = result.sort('-cheapestPrice');
        } else if (sort === 'rating_desc') {
            result = result.sort('-rating');
        } else {
            result = result.sort('-createdAt'); // Default
        }

        // 5. Limit for pagination (initial)
        if (limit) result = result.limit(Number(limit));

        const hotels = await result;
        res.status(200).json(hotels);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
const getHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        res.status(200).json(hotel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get unique districts (cities)
// @route   GET /api/hotels/districts
// @access  Public
const getDistricts = async (req, res) => {
    try {
        // More robust distinct calls using a simple try/catch for each
        const cities = await Hotel.distinct('city').catch(() => []);
        const districts = await Hotel.distinct('district').catch(() => []);
        const states = await Hotel.distinct('state').catch(() => []);
        
        res.status(200).json({
            cities: [...new Set(cities.filter(Boolean))],
            districts: [...new Set(districts.filter(Boolean))],
            states: [...new Set(states.filter(Boolean))]
        });
    } catch (err) {
        console.error("DISTRICTS ERROR:", err);
        res.status(200).json({ cities: [], districts: [], states: [] }); 
    }
};

module.exports = { createHotel, updateHotel, deleteHotel, getHotels, getHotel, getDistricts };
