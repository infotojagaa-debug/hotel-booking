const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const upload = require('./utils/upload');
const passport = require('passport');
const session = require('express-session');
const connectDB = require('./config/db');
const validateEnv = require('./utils/envValidator');

// Passport config
require('./config/passport')(passport);

dotenv.config();

// Validate Environment before starting
validateEnv();

connectDB().then(async () => {
    // ── One-time migration: drop old global code unique index ──────────────
    try {
        const mongoose = require('mongoose');
        const offerCollection = mongoose.connection.db.collection('offers');
        const indexes = await offerCollection.indexes();
        const hasOldIndex = indexes.some(i => i.name === 'code_1');
        if (hasOldIndex) {
            await offerCollection.dropIndex('code_1');
            console.log('[Migration] Dropped old global code_1 index from offers.');
        }
    } catch (e) {
        console.warn('[Migration] Index drop skipped (may already be gone):', e.message);
    }

    // Auto-seed default platform offers on every startup (idempotent)
    try {
        const { seedDefaultOffers } = require('./controllers/offerController');
        await seedDefaultOffers({ body: {} }, {
            json: (msg) => console.log('[Auto-Seed Offers]', typeof msg === 'object' ? msg.message : msg)
        });
    } catch (e) {
        console.warn('[Auto-Seed Offers] Skipped:', e.message);
    }
});

const app = express();

// CORS must be first so preflight OPTIONS requests are handled before body parsing
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.options(/.*/, cors()); // Handle all preflight OPTIONS requests (regex works with all path-to-regexp versions)

// Stripe Webhook needs raw body (must be before express.json)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sessions
app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false,
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/manager', require('./routes/managerRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));

// Image upload route
app.post('/api/upload', (req, res) => {
    try {
        upload.single('image')(req, res, function (err) {
            if (err) {
                console.error('Multer Error:', err);
                return res.status(400).json({ 
                    message: `Upload Failed: ${err.message}`, 
                    code: err.code || 'MULTER_ERR' 
                });
            }
            if (!req.file) {
                return res.status(400).json({ message: 'No file provided' });
            }
            res.status(200).json({ 
                message: 'Image uploaded successfully!',
                url: `/uploads/${req.file.filename}` 
            });
        });
    } catch (error) {
        console.error('Upload Route Crash:', error);
        res.status(500).json({ message: 'Internal Server Error during upload', error: error.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong on the server', error: err.message });
});

app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    res.status(200).json({
        status: 'Server is running',
        database: dbStatus,
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

const http = require('http');
const { Server } = require('socket.io');
const socketManager = require('./utils/socketManager');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust to match frontend URL in production
    methods: ['GET', 'POST']
  }
});

socketManager.init(io);

server.listen(PORT, () => {
    console.log(`Server & WebSockets running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
