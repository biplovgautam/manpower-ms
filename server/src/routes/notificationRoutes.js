const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Adjust path as needed
const {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    getWeeklySummary
} = require('../controllers/notificationController');

router.use(protect); // All notification routes require login

router.post('/create', createNotification);
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.route('/weekly-summary').get(protect, getWeeklySummary);

module.exports = router;