// routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth'); // Verify path is correct
const {
    togglePassportPrivacy,
    changeEmail,
    getBillingInfo,
    toggleBlockEmployee,
    getBlockedEmployees,
    updateNotificationSettings
} = require('../controllers/settingsController');

// --- SHARED SETTINGS (Available to Admin & Employee) ---
// Note: Employees use these to manage their own profile/notifications
router.patch('/change-email', protect, changeEmail);
router.patch('/notifications', protect, updateNotificationSettings);

// --- ADMIN ONLY SETTINGS ---
// Everything below this line requires 'admin' or 'super_admin' roles
router.use(protect, authorizeRoles('admin', 'super_admin'));

router.patch('/toggle-passport-privacy', togglePassportPrivacy);
router.get('/billing', getBillingInfo);
router.get('/blocked-members', getBlockedEmployees);
router.patch('/block-member/:employeeId', toggleBlockEmployee);

module.exports = router;