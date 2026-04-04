const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const Review = require('./models/Review');
const Booking = require('./models/Booking');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const removeHotels = async () => {
    try {
        const hotelNames = ["Elite Urban Suites", "Elite Grand Marina & Spa"];
        console.log(`\n--- REMOVING TEST HOTELS: ${hotelNames.join(', ')} ---`);

        for (const name of hotelNames) {
            const hotel = await Hotel.findOne({ name });
            if (hotel) {
                const hotelId = hotel._id;
                
                // 1. Delete associated Rooms
                const roomResult = await Room.deleteMany({ hotel: hotelId });
                console.log(`🗑️  Deleted ${roomResult.deletedCount} rooms for "${name}"`);

                // 2. Delete associated Reviews
                const reviewResult = await Review.deleteMany({ hotel: hotelId });
                console.log(`🗑️  Deleted ${reviewResult.deletedCount} reviews for "${name}"`);

                // 3. Delete associated Bookings (Optional, but good for cleanup)
                const bookingResult = await Booking.deleteMany({ hotel: hotelId });
                console.log(`🗑️  Deleted ${bookingResult.deletedCount} bookings for "${name}"`);

                // 4. Delete the Hotel itself
                await Hotel.findByIdAndDelete(hotelId);
                console.log(`✅ Removed Hotel: "${name}"`);
            } else {
                console.log(`ℹ️  Hotel "${name}" not found (already deleted?)`);
            }
        }

        console.log('--- CLEANUP COMPLETE ---');
        process.exit();
    } catch (error) {
        console.error('❌ Error during removal:', error);
        process.exit(1);
    }
};

removeHotels();
