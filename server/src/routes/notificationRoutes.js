const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth'); // Adjust path as needed
const {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead
} = require('../controllers/notificationController');

router.use(authenticateUser); // All notification routes require login

router.post('/create', createNotification);
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;