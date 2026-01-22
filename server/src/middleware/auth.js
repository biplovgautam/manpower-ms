const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User'); // Import User model to check status

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Authentication invalid.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // --- NEW: Check if user is blocked ---
        const user = await User.findById(payload.userId).select('isBlocked');
        if (!user || user.isBlocked) {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: 'Your account has been restricted. Please contact the administrator.'
            });
        }

        req.user = {
            userId: payload.userId,
            role: payload.role,
            companyId: payload.companyId
        };

        next();
    } catch (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Authentication failed.' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: `Access denied for role: ${req.user.role}`
            });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };