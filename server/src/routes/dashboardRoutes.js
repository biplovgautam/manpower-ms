const express = require('express');
const router = express.Router();
const { getDashboardData, addNote, updateNote, deleteNote } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getDashboardData);
router.route('/notes').post(protect, addNote);
router.route('/notes/:id').patch(protect, updateNote).delete(protect, deleteNote);

module.exports = router;