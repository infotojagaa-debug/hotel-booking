const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' }); // Load backend env

const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const Offer = require('./models/Offer');
const User = require('./models/User');

const fixDBUrls = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB.');

        // Fix Hotels
        const hotels = await Hotel.find();
        let hotelsFixed = 0;
        for (const hotel of hotels) {
            let changed = false;
            if (hotel.images && hotel.images.length > 0) {
                for (let i = 0; i < hotel.images.length; i++) {
                    if (hotel.images[i].includes('http://localhost:5000')) {
                        hotel.images[i] = hotel.images[i].replace('http://localhost:5000', '');
                        changed = true;
                    }
                }
            }
            if (changed) {
                await hotel.save();
                hotelsFixed++;
            }
        }
        console.log(`Fixed ${hotelsFixed} hotels.`);

        // Fix Rooms
        const rooms = await Room.find();
        let roomsFixed = 0;
        for (const room of rooms) {
            let changed = false;
            if (room.images && room.images.length > 0) {
                for (let i = 0; i < room.images.length; i++) {
                    if (room.images[i].includes('http://localhost:5000')) {
                        room.images[i] = room.images[i].replace('http://localhost:5000', '');
                        changed = true;
                    }
                }
            }
            if (changed) {
                await room.save();
                roomsFixed++;
            }
        }
        console.log(`Fixed ${roomsFixed} rooms.`);

        // Fix Offers
        const offers = await Offer.find();
        let offersFixed = 0;
        for (const offer of offers) {
            if (offer.bannerImage && offer.bannerImage.includes('http://localhost:5000')) {
                offer.bannerImage = offer.bannerImage.replace('http://localhost:5000', '');
                await offer.save();
                offersFixed++;
            }
        }
        console.log(`Fixed ${offersFixed} offers.`);

        // Fix Users profilePic
        const users = await User.find();
        let usersFixed = 0;
        for (const user of users) {
             if (user.profilePic && user.profilePic.includes('http://localhost:5000')) {
                 user.profilePic = user.profilePic.replace('http://localhost:5000', '');
                 await user.save();
                 usersFixed++;
             }
        }
        console.log(`Fixed ${usersFixed} users.`);

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixDBUrls();
