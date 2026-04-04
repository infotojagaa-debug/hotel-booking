const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/hotel-booking', {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected!');

        const User = require('./models/User');

        // Delete any existing user with this email to avoid duplicates
        await User.deleteOne({ email: 'admin1@gmail.com' });

        // Create the new admin
        await User.create({
            name: 'Admin',
            email: 'admin1@gmail.com',
            password: 'admin123',
            role: 'Admin',
            isVerified: true
        });

        console.log('\n====================================');
        console.log('✅ Admin account created successfully!');
        console.log('Email: admin1@gmail.com');
        console.log('Password: admin123');
        console.log('====================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.error('\n⚠️ MongoDB is NOT running. Please start MongoDB with Administrator privileges first!');
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin();
