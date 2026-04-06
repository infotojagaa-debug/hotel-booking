const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const { assignDefaultCoordinates } = require('../utils/geoHelper');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixCoordinates = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/hotel-booking';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB for coordinate fix...');

        // Find hotels that are at [0,0] or have missing coordinates
        const hotelsToFix = await Hotel.find({
            $or: [
                { latitude: 0 },
                { longitude: 0 },
                { latitude: { $exists: false } },
                { longitude: { $exists: false } }
            ]
        });

        console.log(`Found ${hotelsToFix.length} hotels with missing or [0,0] coordinates.`);

        for (let hotel of hotelsToFix) {
            console.log(`Fixing coordinates for: ${hotel.name} (City: ${hotel.city})`);
            
            // Re-apply the smart coordinate logic
            hotel = assignDefaultCoordinates(hotel);
            
            await hotel.save();
            console.log(`   -> New Coords: [${hotel.latitude}, ${hotel.longitude}]`);
        }

        console.log('Coordinate fix complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing coordinates:', error);
        process.exit(1);
    }
};

fixCoordinates();
