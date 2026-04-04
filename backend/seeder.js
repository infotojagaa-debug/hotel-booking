const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./models/Room');
const Hotel = require('./models/Hotel');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
    try {
        // 1. Clear existing predefined data
        await Room.deleteMany({ isPredefined: true });
        await Hotel.deleteMany({ isAdminHotel: true });

        // 2. Ensure an Admin user exists for ownership
        let admin = await User.findOne({ role: 'Admin' });
        if (!admin) {
            admin = await User.create({
                name: 'Elite Admin',
                email: 'admin@elitestays.com',
                password: 'adminpassword123',
                role: 'Admin',
                isVerified: true,
                isApproved: true
            });
            console.log('✅ Created Default Admin for Seeding');
        }

        // 3. Create showcase "Elite Stays" flagship hotels
        const flagshipHotel = await Hotel.create({
            name: 'Elite Grand Marina & Spa',
            city: 'Chennai',
            zipCode: '600001',
            address: '12-A, Marina View Road, Chennai, Tamil Nadu',
            locationHint: 'Sea View',
            description: 'Experience the pinnacle of luxury at our Elite Grand Marina. Featuring world-class spa facilities, private beach access, and multi-cuisine dining, it is the crown jewel of Elite Stays.',
            type: 'Resort',
            starRating: 5,
            cheapestPrice: 4500,
            distanceFromCenter: '1.2km',
            amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant'],
            images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000'],
            isAdminHotel: true,
            isApproved: true,
            commissionPercentage: 10,
            manager: admin._id,
            rating: 4.9,
            reviewCount: 150
        });

        const secondHotel = await Hotel.create({
            name: 'Elite Urban Suites',
            city: 'Mumbai',
            zipCode: '400001',
            address: 'Elite Towers, BKC, Mumbai',
            locationHint: 'Business Hub',
            description: 'The preferred choice for business travelers in Mumbai. Sophisticated suites equipped with modern tech and executive lounges.',
            type: 'Hotel',
            starRating: 5,
            cheapestPrice: 6500,
            distanceFromCenter: '0.5km',
            amenities: ['WiFi', 'Gym', 'Parking', 'AC'],
            images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'],
            isAdminHotel: true,
            isApproved: true,
            commissionPercentage: 15,
            manager: admin._id,
            rating: 4.7,
            reviewCount: 85
        });

        // 4. Create rooms linked to these hotels
        const roomsData = [
            {
                name: 'Elite Ocean View Suite',
                type: 'Suite',
                pricePerNight: 8500,
                description: 'A spacious suite with floor-to-ceiling windows offering panoramic views of the Bay of Bengal.',
                images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800'],
                amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Ocean View'],
                maxGuests: 2,
                hotel: flagshipHotel._id,
                roomNumbers: [{ number: 101, unavailableDates: [] }, { number: 102, unavailableDates: [] }],
                totalRoomCount: 2,
                isPredefined: true
            },
            {
                name: 'Elite Presidential Penthouse',
                type: 'Penthouse',
                pricePerNight: 25000,
                description: 'The ultimate luxury experience with a private terrace and 24/7 butler service.',
                images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'],
                amenities: ['WiFi', 'TV', 'Kitchen', 'Balcony', 'Pool'],
                maxGuests: 4,
                hotel: flagshipHotel._id,
                roomNumbers: [{ number: 501, unavailableDates: [] }],
                totalRoomCount: 1,
                isPredefined: true
            },
            {
                name: 'Executive Business Suite',
                type: 'Studio',
                pricePerNight: 6500,
                description: 'Designed for productivity and comfort, featuring a large dedicated workspace.',
                images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800'],
                amenities: ['WiFi', 'TV', 'Workspace', 'Mini Bar'],
                maxGuests: 2,
                hotel: secondHotel._id,
                roomNumbers: [{ number: 201, unavailableDates: [] }, { number: 202, unavailableDates: [] }, { number: 203, unavailableDates: [] }],
                totalRoomCount: 3,
                isPredefined: true
            }
        ];

        await Room.insertMany(roomsData);
        console.log('✅ Elite Stays Data Seeded Successfully with Admin Ownership');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
