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
  .get(getEmployers) // Public or private depending on your needs
  .post(protect, createEmployer); // Only authenticated users can add

module.exports = router;