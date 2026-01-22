const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const {
    togglePassportPrivacy,
    changeEmail,
    getBillingInfo,
    toggleBlockEmployee,
    getBlockedEmployees,
    updateNotificationSettings
} = require('../controllers/settingsController');

// --- SHARED SETTINGS (Admin & Employee) ---
router.patch('/change-email', protect, changeEmail);
router.patch('/notifications', protect, updateNotificationSettings);

// --- ADMIN ONLY SETTINGS ---
router.use(protect, authorizeRoles('admin', 'super_admin'));

router.patch('/toggle-passport-privacy', togglePassportPrivacy);
router.get('/billing', getBillingInfo);
router.get('/blocked-members', getBlockedEmployees);
router.patch('/block-member/:employeeId', toggleBlockEmployee);

module.exports = router;