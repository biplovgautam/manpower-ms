const express = require('express');
const router = express.Router();
const { 
  createEmployer, 
  getEmployers,
  getEmployerDetails, // Imported new function
  updateEmployer, 
  deleteEmployer 
} = require('../controllers/employerController');

const { protect } = require('../middleware/auth');

// Apply protection to all routes in this file
router.use(protect);

router.route('/')
  .get(getEmployers)
  .post(createEmployer);

// Routes that require an ID
router.route('/:id')
  .get(getEmployerDetails) // Added GET for detail view
  .put(updateEmployer)
  .delete(deleteEmployer);

module.exports = router;