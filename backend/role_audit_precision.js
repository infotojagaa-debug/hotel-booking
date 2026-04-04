const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const auditRolesPrecision = async () => {
    try {
        const allUsers = await User.find({});
        console.log('\n--- PRECISION ROLE AUDIT ---');
        allUsers.forEach(u => {
            console.log(`Email: [${u.email}]`);
            console.log(`Role:  [${u.role}] (Length: ${u.role ? u.role.length : 0})`);
            console.log('----------------------------');
        });
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

auditRolesPrecision();
