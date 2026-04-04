const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/users/auth/google/callback',
                proxy: true,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Try to find by googleId first
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    } 
                    
                    // Check if an account already exists with this email
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // User exists, but registered via email/password. Let's link Google.
                        user.googleId = profile.id;
                        user.isVerified = true;
                        // isOAuthUser might stay false if they originally used a password, that's fine
                        await user.save();
                        return done(null, user);
                    }

                    // Otherwise, create a completely new user
                    const newUser = {
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        isVerified: true,
                        isOAuthUser: true,
                        authType: 'google'
                    };
                    
                    user = await User.create(newUser);
                    return done(null, user);
                    
                } catch (err) {
                    console.error("Google OAuth Error: ", err);
                    return done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
