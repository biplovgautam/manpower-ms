// controllers/settingsController.js
const User = require('../models/User');
const Company = require('../models/Company');
const { StatusCodes } = require('http-status-codes');

// 1. Toggle Passport Privacy (Admin Only)
const togglePassportPrivacy = async (req, res) => {
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Company not found" });

    company.settings.isPassportPrivate = !company.settings.isPassportPrivate;
    await company.save();
    res.status(StatusCodes.OK).json({
        success: true,
        isPassportPrivate: company.settings.isPassportPrivate
    });
};

// 2. Change Email (Admin & Employee)
const changeEmail = async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide a new email" });

    // Check if email is already taken by another user
    const emailExists = await User.findOne({ email: newEmail.toLowerCase().trim() });
    if (emailExists) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Email already in use" });

    const user = await User.findById(req.user.userId);
    user.email = newEmail.toLowerCase().trim();
    await user.save();
    res.status(StatusCodes.OK).json({ success: true, msg: "Email updated successfully" });
};

// 3. Billing Info (Admin Only)
const getBillingInfo = async (req, res) => {
    const company = await Company.findById(req.user.companyId).select('billing');
    if (!company || !company.billing) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Billing info not found" });

    res.status(StatusCodes.OK).json({
        plan: company.billing.plan,
        startDate: company.billing.startDate,
        expiryDate: company.billing.expiryDate,
        // Calculate status based on date
        status: new Date() > new Date(company.billing.expiryDate) ? 'Expired' : 'Active'
    });
};

// 4. Restricted Members Logic (Admin Only - Toggle Block/Unblock)
const toggleBlockEmployee = async (req, res) => {
    const { employeeId } = req.params;

    // Prevent self-blocking
    if (employeeId === req.user.userId.toString()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "You cannot block/unblock yourself" });
    }

    const user = await User.findOne({ _id: employeeId, companyId: req.user.companyId });

    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });

    // Safety check: Don't allow blocking other admins unless current user is super_admin
    if (user.role !== 'employee' && req.user.role !== 'super_admin') {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized to modify admin status" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(StatusCodes.OK).json({
        success: true,
        msg: user.isBlocked ? `Account for ${user.fullName} Blocked` : `Account for ${user.fullName} Unblocked`,
        isBlocked: user.isBlocked
    });
};

// 5. Get Blocked Employees List (Admin Only)
const getBlockedEmployees = async (req, res) => {
    const blockedList = await User.find({
        companyId: req.user.companyId,
        isBlocked: true,
        role: 'employee'
    }).select('fullName email contactNumber createdAt');

    res.status(StatusCodes.OK).json({ success: true, data: blockedList });
};

// 6. Notification Toggles
const updateNotificationSettings = async (req, res) => {
    const { settings } = req.body; // Expects an object like { newJob: false, enabled: true }
    const user = await User.findById(req.user.userId);

    // Deep merge or specific assignment to prevent losing other keys
    if (settings && typeof settings === 'object') {
        Object.keys(settings).forEach(key => {
            user.notificationSettings[key] = settings[key];
        });
        user.markModified('notificationSettings');
    }

    await user.save();
    res.status(StatusCodes.OK).json({ success: true, data: user.notificationSettings });
};

module.exports = {
    togglePassportPrivacy,
    changeEmail,
    getBillingInfo,
    toggleBlockEmployee,
    getBlockedEmployees,
    updateNotificationSettings
};