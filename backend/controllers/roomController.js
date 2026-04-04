const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
const getRooms = async (req, res) => {
    // We now strictly require a hotel ID to fetch rooms. No global room fetching allowed.
    const targetHotelId = req.query.hotelId || req.query.hotel;
    
    if (!targetHotelId) {
        return res.json([]); // Return empty array if no hotel specified
    }

    let query = { 
        hotel: targetHotelId,
        isPredefined: { $ne: true } // Exclude any seeded/static rooms
    };

    const { guests, minPrice, maxPrice, sort } = req.query;
    
    if (guests) {
        query.maxGuests = { $gte: Number(guests) };
    }
    
    if (minPrice || maxPrice) {
        query.pricePerNight = {};
        if (minPrice) query.pricePerNight.$gte = Number(minPrice);
        if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort === 'priceLow') sortOption = { pricePerNight: 1 };
    else if (sort === 'priceHigh') sortOption = { pricePerNight: -1 };
    else sortOption = { createdAt: -1 };

    try {
        const rooms = await Room.find(query)
            .sort(sortOption)
            .populate('hotel', 'name city address type starRating images rating reviewCount policies');
        
        res.json(rooms);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('hotel');
        if (room) {
            res.json(room);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private/Admin
const createRoom = async (req, res) => {
    const { name, type, pricePerNight, description, images, amenities, maxGuests, roomNumbers } = req.body;
    const hotelId = req.body.hotelId || req.body.hotel;

    try {
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

        // Authorization check: Only manager of this hotel or admin
        if (hotel.manager.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'Not authorized to add rooms to this hotel' });
        }

        const room = new Room({
            name,
            type,
            pricePerNight,
            description,
            images,
            amenities,
            maxGuests,
            hotel: hotelId,
            roomNumbers
        });

        const createdRoom = await room.save();
        res.status(201).json(createdRoom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
const updateRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('hotel');
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Authorization check
        if (room.hotel.manager.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'Not authorized to update this room' });
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(updatedRoom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('hotel');
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Authorization check
        if (room.hotel && room.hotel.manager && room.hotel.manager.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'Not authorized to delete this room' });
        }

        await Room.findByIdAndDelete(req.params.id);
        res.json({ message: 'Room removed' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
