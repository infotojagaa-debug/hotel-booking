const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return res.status(401).json({ message: 'User no longer exists' });
            
            if (user.isSuspended) {
                return res.status(403).json({ message: 'Your account has been suspended by the administrator.' });
            }
            
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        const allowedRoles = roles.map(r => r.toLowerCase());
        const userRole = req.user && req.user.role ? req.user.role.toLowerCase() : 'none';
        
        console.log(`[AUTH DEBUG] User: ${req.user.email} | Role: "${userRole}" | Allowed: [${allowedRoles.join(', ')}]`);
        
        if (req.user && allowedRoles.includes(userRole)) {
            next();
        } else {
            console.warn(`[AUTH DENIED] User: ${req.user.email} | Role: "${userRole}" not in [${allowedRoles.join(', ')}]`);
            res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized to access this route` 
            });
        }
    };
};

module.exports = { protect, authorize };
