const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }
        
        // Manager Approval Check
        if (user.role === 'manager' && !user.isApproved) {
            return res.status(403).json({ message: 'Your manager account is awaiting admin approval. Please wait for confirmation.' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            token: generateToken(user._id, user.role),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, phone, hotelName, hotelLocation, licenseInfo } = req.body;

    try {
        // Standardise roles to lowercase
        const roleMap = {
            'Customer': 'customer',
            'Hotel Manager': 'manager',
            'Admin': 'admin',
            'customer': 'customer',
            'manager': 'manager',
            'admin': 'admin'
        };
        const userRole = roleMap[role] || 'customer';
        const lowerEmail = email.toLowerCase().trim();

        const userExists = await User.findOne({ email: lowerEmail });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email: lowerEmail,
            password,
            role: userRole,
            isVerified: true,
            isApproved: userRole === 'customer', // Customers auto-approved, Managers need admin
            verificationToken: require('crypto').randomBytes(20).toString('hex'),
            authType: 'normal'
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid user data' });
        }

        // Try sending verification email, but don't block registration if it fails
        try {
            const verificationUrl = `${req.protocol}://${req.get('host')}/api/users/verify/${user.verificationToken}`;
            const message = `Please verify your email by clicking the link: \n\n ${verificationUrl}`;
            await sendEmail({ email: user.email, subject: 'Email Verification', message });
        } catch (emailErr) {
            console.warn('Verification email could not be sent:', emailErr.message);
            // Don't fail the registration — just log it
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(400).json({ message: err.message || 'Registration failed' });
    }
};

// @desc    Verify email
// @route   GET /api/users/verify/:token
// @access  Public
const verifyEmail = async (req, res) => {
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Forgot password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message,
        });

        res.status(200).json({ message: 'Email sent' });
    } catch (err) {
        console.error(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

// @desc    Reset password
// @route   PUT /api/users/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    const crypto = require('crypto');
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
    });
};

// @desc    Auth Google Callback
// @route   GET /api/users/auth/google/callback
// @access  Private
const authGoogleCallback = async (req, res) => {
    const user = req.user;

    // Generate 6-char alphanumeric OTP for Google 2FA
    const otp = require('crypto').randomBytes(3).toString('hex').toUpperCase();

    user.loginOtp = otp;
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send the OTP via email
    const textMessage = `You successfully authenticated with Google. To complete your sign-in, please use the following verification code:\n\n${otp}\n\nThis code expires in 10 minutes.`;
    
    // HTML Template matching Booking.com styling
    const htmlMessage = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; background-color: #ffffff;">
        <div style="background-color: #6d5dfc; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">Elite Stays</div>
            <div style="color: #ffffff; font-size: 24px;">&#128100;</div>
        </div>
        <div style="padding: 32px 24px;">
            <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Verify your Google Sign-In</h1>
            <p style="color: #1a1a1a; font-size: 16px; margin-bottom: 24px;">Hi,</p>
            <p style="color: #1a1a1a; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
                You just requested a verification code for <a href="mailto:${user.email}" style="color: #6d5dfc; text-decoration: none;">${user.email}</a>. This unique code allows you to securely complete your sign-in without using a password.
            </p>
            <div style="text-align: center; margin-bottom: 40px;">
                <span style="font-size: 56px; font-weight: 400; letter-spacing: 8px; color: #1a1a1a; font-family: monospace;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
                This code can only be used once and expires after 10 minutes. Don't share this code with anyone.
            </p>
        </div>
    </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: `Elite Stays \u2013 ${otp} is your verification code`,
            message: textMessage,
            html: htmlMessage
        });
    } catch (err) {
        console.error("Failed to send Google OTP email:", err);
    }

    // Redirect to frontend to prompt for OTP instead of issuing token immediately
    // Google login is typically for customers on this platform
    res.redirect(`${process.env.FRONTEND_URL}/login?require_otp=true&email=${user.email}&role=customer`);
};

// @desc    Request OTP for Passwordless Login/Signup
// @route   POST /api/users/request-otp
// @access  Public
const requestOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Generate 6-char alphanumeric OTP
    const otp = require('crypto').randomBytes(3).toString('hex').toUpperCase();

    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            name: email.split('@')[0], // placeholder name
            email,
            password: 'not_used_in_otp_flow', // dummy password, will be hashed but irrelevant
            role: 'customer',
            authType: 'normal'
        });
    }

    user.loginOtp = otp;
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send the OTP via email
    const message = `You just requested a verification code for ${email}. This unique code allows you to create an account or sign in without using a password.\n\n${otp}\n\nThis code can only be used once and expires after 10 minutes.`;

    try {
        await sendEmail({
            email: user.email,
            subject: `Your verification code is ${otp}`,
            message,
        });

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error(err);
        user.loginOtp = undefined;
        user.loginOtpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

// @desc    Verify OTP and Login
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOtpLogin = async (req, res) => {
    const { email, otp, role } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ 
        email, 
        loginOtp: otp,
        loginOtpExpire: { $gt: Date.now() } 
    });

    if (!user) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    if (user.isSuspended) {
        return res.status(403).json({ message: 'Your account has been suspended.' });
    }

    // Manager Approval Check
    if (user.role === 'manager' && !user.isApproved) {
        return res.status(403).json({ message: 'Your manager account is awaiting admin approval.' });
    }

    // Clear the OTP fields
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    
    // If they were verifying for the first time, mark them as verified
    if (!user.isVerified) {
        user.isVerified = true;
    }
    
    await user.save({ validateBeforeSave: false });

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id, user.role),
    });
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified,
            token: generateToken(updatedUser._id, updatedUser.role),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { authUser, registerUser, getUserProfile, updateUserProfile, verifyEmail, forgotPassword, resetPassword, authGoogleCallback, requestOtp, verifyOtpLogin };
