const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hotel = require('./models/Hotel');

dotenv.config();

const seedCoordinates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hotels = await Hotel.find();
        
        const cities = {
            'Chennai': { lat: 13.0827, lng: 80.2707 },
            'Bengaluru': { lat: 12.9716, lng: 77.5946 },
            'Bangalore': { lat: 12.9716, lng: 77.5946 },
            'Tokyo': { lat: 35.6762, lng: 139.6503 }
        };

        const sampleAmenities = ['Wifi', 'Parking', 'Pool', 'Breakfast', 'Gym'];

        for (let hotel of hotels) {
            const baseCoord = cities[hotel.city] || cities['Chennai'];
            // Add slight randomness so markers don't overlap perfectly
            const lat = baseCoord.lat + (Math.random() - 0.5) * 0.05;
            const lng = baseCoord.lng + (Math.random() - 0.5) * 0.05;
            
            hotel.latitude = lat;
            hotel.longitude = lng;
            hotel.amenities = sampleAmenities.sort(() => 0.5 - Math.random()).slice(0, 3);
            hotel.starRating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
            
            await hotel.save();
            console.log(`Updated ${hotel.name} in ${hotel.city}`);
        }

        console.log('Finished seeding coordinates and amenities');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedCoordinates();
