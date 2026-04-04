const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');

const CITY_COORDS = {
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Salem': { lat: 11.6643, lng: 78.1460 },
    'Bengaluru': { lat: 12.9716, lng: 77.5946 },
    'Coimbatore': { lat: 11.0168, lng: 76.9558 },
    'Madurai': { lat: 9.9252, lng: 78.1198 },
    'Erode': { lat: 11.3410, lng: 77.7172 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 }
};

const cleanup = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/hotel-booking');
        console.log('Connected to MongoDB');

        const hotels = await Hotel.find({});
        console.log(`Found ${hotels.length} hotels to update.`);

        for (const hotel of hotels) {
            // Normalize city name
            let city = hotel.city;
            if (city.toLowerCase() === 'chennai') city = 'Chennai';
            if (city.toLowerCase() === 'bengaluru') city = 'Bengaluru';
            if (city.toLowerCase() === 'salem') city = 'Salem';
            if (city.toLowerCase() === 'cod') city = 'Coimbatore';

            const base = CITY_COORDS[city] || CITY_COORDS['Chennai'];
            
            // Add unique random offset (approx 5-10km range)
            const latOffset = (Math.random() - 0.5) * 0.08;
            const lngOffset = (Math.random() - 0.5) * 0.08;

            await Hotel.findByIdAndUpdate(hotel._id, {
                city,
                district: city + ' District',
                latitude: base.lat + latOffset,
                longitude: base.lng + lngOffset
            });
        }

        console.log('Successfully updated all hotel coordinates with unique offsets.');
        process.exit(0);
    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
};

cleanup();
