const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const count = async () => {
    try {
        const total = await Hotel.countDocuments();
        const salem = await Hotel.countDocuments({ city: /Salem/i });
        const others = await Hotel.find({ city: { $not: /Salem/i } }).select('name city district state');
        
        console.log('Total Hotels:', total);
        console.log('Salem Hotels Count:', salem);
        console.log('Non-Salem Hotels:', others);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

setTimeout(count, 1000);
