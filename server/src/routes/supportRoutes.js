const express = require('express');
const router = express.Router();
const {
    submitFeedback,
    getAllFeedback,
    getMyReports
} = require('../controllers/supportController');
const { protect, authorizeRoles } = require('../middleware/auth');

// 1. Submit feedback (Protected - All roles)
router.post('/', protect, submitFeedback);

// 2. Get user's personal history (Protected - All roles)
router.get('/my-reports', protect, getMyReports);

// 3. Get all feedback (Protected - Super Admin only)
router.get('/all', protect, authorizeRoles('super_admin'), getAllFeedback);

module.exports = router;