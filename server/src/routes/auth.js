const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { register, login, registerEmployee, getAllEmployees, forgotPassword, resetPassword } = require('../controllers/auth');
const { protect, authorizeRoles } = require('../middleware/auth');

// --- MULTER CONFIG ---
const storage = multer.memoryStorage(); // Store file in buffer for Base64 conversion
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'), false);
    }
});

// --- RATE LIMITS ---
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// --- ROUTES ---

// register route handles 'logo' field from the Agency Registration UI
router.post('/register', upload.single('logo'), register);

router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/add-employee', protect, authorizeRoles('admin', 'super_admin'), registerEmployee);
router.get('/employees', protect, authorizeRoles('admin', 'super_admin'), getAllEmployees);

module.exports = router;