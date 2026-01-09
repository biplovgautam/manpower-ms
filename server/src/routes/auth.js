// D:\manpower-ms\server\routes\auth.js

const express = require('express');
const router = express.Router();

const { register, login, registerEmployee, getAllEmployees , forceResetPassword} = require('../controllers/auth'); // Import new function
const { protect, authorizeRoles } = require('../middleware/auth'); // Import middleware

// Public routes for authentication
router.post('/register', register);
router.post('/login', login);

// Protected routes for internal actions
router.post('/add-employee', protect, authorizeRoles('admin'), registerEmployee);
router.post('/force-reset', forceResetPassword);
router.get('/employees', protect, authorizeRoles('admin'), getAllEmployees); // New route to get all employees  

module.exports = router;