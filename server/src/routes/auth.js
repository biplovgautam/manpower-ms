const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const {
    register, login, registerEmployee,
    getAllEmployees, getSingleEmployeeDetails,
    forgotPassword, resetPassword, resendOTP, getMe
} = require('../controllers/auth');
const { protect, authorizeRoles } = require('../middleware/auth');

// --- MULTER CONFIG ---
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'), false);
    }
});

const handleMultipart = (req, res, next) => {
    upload.single('logo')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ msg: 'Logo too large (Max 2MB).' });
            return res.status(400).json({ msg: err.message });
        } else if (err) return res.status(400).json({ msg: err.message });
        next();
    });
};

// --- RATE LIMITER CONFIG ---
const createLimiter = (maxAttempts, mins) => rateLimit({
    windowMs: mins * 60 * 1000,
    max: maxAttempts,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.body.identifier || req.ip,
    handler: (req, res) => {
        const remainingMs = req.rateLimit.resetTime - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        const identity = req.body.identifier || "This account";
        res.status(429).json({
            success: false,
            isLocked: true,
            msg: `Security Lock: ${identity} is temporarily disabled. Try again in ${remainingMinutes} minute(s).`,
            remainingMinutes
        });
    }
});

const loginLimiter = createLimiter(5, 5);
const forgotLimiter = createLimiter(3, 15);

// --- ROUTES ---
router.post('/register', handleMultipart, register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/resend-otp', forgotLimiter, resendOTP);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

// Employee Management
router.post('/add-employee', protect, authorizeRoles('admin', 'super_admin'), registerEmployee);
router.get('/employees', protect, authorizeRoles('admin', 'super_admin'), getAllEmployees);

/** * FETCH SINGLE EMPLOYEE (HARI) DETAILS
 * Make sure your frontend calls: /api/employees/${id}
 */
router.get('/employees/:id', protect, authorizeRoles('admin', 'super_admin'), getSingleEmployeeDetails);

module.exports = router;