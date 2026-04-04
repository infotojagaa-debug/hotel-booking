const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

/**
 * Enhanced Database Connection Utility
 * Features: Robust retries, connection state listeners, and graceful shutdown.
 */
const connectDB = async () => {
    let retries = 5;
    const retryInterval = 5000; // 5 seconds

    // Add listeners for connection state changes
    mongoose.connection.on('connecting', () => {
        console.log('⏳ Connecting to MongoDB...');
    });

    mongoose.connection.on('connected', () => {
        const host = mongoose.connection.host;
        console.log(`✅ MongoDB Connected: ${host}`);
        if (host.includes('.mongodb.net')) {
            console.log('🚀 Established stable connection to MongoDB Atlas Cluster.');
        } else {
            console.log('🏠 Connected to Local MongoDB Instance (Compass).');
        }
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });

    // Graceful Shutdown Logic
    const gracefulShutdown = (signal) => {
        mongoose.connection.close(() => {
            console.log(`👋 MongoDB connection closed due to ${signal}.`);
            process.exit(0);
        });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Connection Attempt with Selective Retries
    while (retries > 0) {
        try {
            await mongoose.connect(MONGO_URI, {
                // useNewUrlParser and useUnifiedTopology are managed by Mongoose 6+
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10, // Recommended for Shared Atlas clusters
            });
            return; // Exit retry loop on success
        } catch (error) {
            retries -= 1;
            console.error(`❌ Connection Attempt Failed: ${error.message}`);
            
            if (retries === 0) {
                console.error('🚫 FATAL: All connection retries failed.');
                console.error('   💡 Checklist:');
                console.error('   - Is your IP whitelisted in Atlas?');
                console.error('   - Are your Credentials correct in .env?');
                console.error('   - Are you connected to the internet?');
                process.exit(1);
            }
            
            console.log(`🔄 Retrying in ${retryInterval/1000}s... (${retries} attempts left)`);
            await new Promise(res => setTimeout(res, retryInterval));
        }
    }
};

module.exports = connectDB;
