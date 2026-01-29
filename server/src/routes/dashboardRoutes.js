const express = require('express');
const router = express.Router();
const { getDashboardData, addNote, updateNote, deleteNote, markReminderAsDone, searchGlobal } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/').get(protect, getDashboardData);

// Note: Key must be 'attachment'
router.route('/notes')
    .post(protect, upload.single('attachment'), addNote);

router.route('/notes/:id')
    .patch(protect, upload.single('attachment'), updateNote)
    .delete(protect, deleteNote);
router.patch('/notes/:id/done', protect, markReminderAsDone);
router.get('/search', protect, searchGlobal);

module.exports = router;