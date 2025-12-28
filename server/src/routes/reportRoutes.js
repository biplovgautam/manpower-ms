const express = require('express');
const router = express.Router();
const { getPerformanceStats } = require('../controllers/reportController');
const { protect } = require('../middleware/auth'); // Ensure user is logged in

// Define the endpoint
router.get('/performance-stats', protect, getPerformanceStats);

module.exports = router;