// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Authentication invalid.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // --- REQUIREMENT 5: LIVE BLOCK CHECK ---
        // We select companyId as well to ensure data isolation throughout the app
        const user = await User.findById(payload.userId).select('isBlocked companyId role');

        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'User no longer exists.' });
        }

        if (user.isBlocked) {
            return res.status(StatusCodes.FORBIDDEN).json({
                msg: 'Your account has been restricted. Access denied.'
            });
        }

        req.user = {
            _id: user._id, // Change 'userId' to '_id'
            role: user.role,
            companyId: user.companyId
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