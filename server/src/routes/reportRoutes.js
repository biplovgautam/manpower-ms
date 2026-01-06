const express = require('express');
const router = express.Router();
const { getPerformanceStats } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/reports/performance-stats
 * @desc    Get executive-level agency analytics (Revenue, Trends, Top Performers)
 * @access  Private (Admin Only)
 */
router.get(
    '/performance-stats',
    protect,
    // If you have role-based middleware, uncomment the line below to secure revenue data:
    // authorize('tenant-admin', 'admin'), 
    getPerformanceStats
);

module.exports = router;