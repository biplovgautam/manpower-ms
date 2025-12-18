const express = require('express');
const router = express.Router();
const { 
  createEmployer, 
  getEmployers 
} = require('../controllers/employerController');

// Import your existing middleware
const { protect } = require('../middleware/auth');

// Define routes
router.route('/')
  .get(protect, getEmployers) // Added protect here
  .post(protect, createEmployer);

module.exports = router;