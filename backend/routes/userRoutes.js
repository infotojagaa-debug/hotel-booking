const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUserProfile, updateUserProfile, verifyEmail, forgotPassword, resetPassword, authGoogleCallback, requestOtp, verifyOtpLogin } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const passport = require('passport');
 
router.post('/', registerUser);
router.post('/register', registerUser);
router.post('/signup', registerUser);
router.post('/login', authUser);
router.get('/verify/:token', verifyEmail);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// OTP Routes
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtpLogin);

// OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), authGoogleCallback);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
