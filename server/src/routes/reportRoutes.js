const express = require('express');
const router = express.Router();
const { getPerformanceStats } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/reports/performance-stats
 * @desc    Get executive-level agency analytics (Workers, Demands, Trends)
 * @params  view (optional) - 'day', 'week', 'month', 'personal'
 * @access  Private (Admin, Super-Admin, or Personnel)
 */
router.get(
    '/performance-stats',
    protect, // Ensures req.user exists
    // authorize('super_admin', 'admin', 'staff'), // Uncomment to restrict access to specific roles
    async (req, res, next) => {
        try {
            // Optional: You can add validation here to check if req.query.view 
            // is one of the allowed values ['day', 'week', 'month', 'personal']
            
            await getPerformanceStats(req, res);
        } catch (error) {
            next(error); // Pass errors to your global error handler
        }
    }
);

module.exports = router;