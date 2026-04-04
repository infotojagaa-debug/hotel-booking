const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const inspectAmenities = async () => {
    try {
        const hotels = await Hotel.find({}).limit(20);
        const allAmenities = new Set();
        const types = new Set();
        
        hotels.forEach(h => {
            if (h.amenities) h.amenities.forEach(a => allAmenities.add(a));
            if (h.type) types.add(h.type);
        });
        
        console.log('Unique Property Types in DB:', [...types]);
        console.log('Unique Amenities in DB:', [...allAmenities]);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

setTimeout(inspectAmenities, 1000);
