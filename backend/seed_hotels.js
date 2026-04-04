const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hotel = require('./models/Hotel');
const User = require('./models/User');

dotenv.config();

const seedHotels = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find an admin or manager to own these hotels
        let manager = await User.findOne({ role: 'Admin' });
        if (!manager) manager = await User.findOne();
        if (!manager) {
            console.error('No user found to assign as manager. Please create a user first.');
            process.exit(1);
        }

        const hotels = [
            {
                name: "Grand Chennai by GRT Hotels",
                type: "Hotel",
                city: "Chennai",
                address: "No. 120, Sir Thyagaraya Rd, Pondy Bazaar",
                distanceFromCenter: "0.5 miles",
                description: "Luxury hotel in the heart of T. Nagar.",
                cheapestPrice: 120,
                featured: true,
                isApproved: true,
                manager: manager._id,
                rating: 4.5,
                reviewCount: 1250,
                starRating: 4,
                latitude: 13.0418,
                longitude: 80.2341,
                amenities: ["Wifi", "Parking", "Pool", "Gym"],
                isPredefined: true
            },
            {
                name: "The Leela Palace Bengaluru",
                type: "Hotel",
                city: "Bengaluru",
                address: "23, HAL Old Airport Rd, ISRO Colony",
                distanceFromCenter: "1.2 miles",
                description: "Opulent palace-style hotel with lush gardens.",
                cheapestPrice: 200,
                featured: true,
                isApproved: true,
                manager: manager._id,
                rating: 4.8,
                reviewCount: 2100,
                starRating: 5,
                latitude: 12.9606,
                longitude: 77.6484,
                amenities: ["Wifi", "Parking", "Pool", "Spa"],
                isPredefined: true
            },
            {
                name: "ITC Grand Chola",
                type: "Hotel",
                city: "Chennai",
                address: "63, Anna Salai, Guindy",
                distanceFromCenter: "2.1 miles",
                description: "One of the largest luxury hotels in India.",
                cheapestPrice: 180,
                featured: false,
                isApproved: true,
                manager: manager._id,
                rating: 4.7,
                reviewCount: 3500,
                starRating: 5,
                latitude: 13.0102,
                longitude: 80.2206,
                amenities: ["Wifi", "Pool", "Gym"],
                isPredefined: true
            }
        ];

        await Hotel.insertMany(hotels);
        console.log('Successfully seeded 3 hotels.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedHotels();
