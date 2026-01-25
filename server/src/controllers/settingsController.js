const User = require('../models/User');
const Company = require('../models/Company');
const { StatusCodes } = require('http-status-codes');

// 1. Toggle Passport Privacy
const togglePassportPrivacy = async (req, res) => {
    try {
        const company = await Company.findById(req.user.companyId);
        if (!company) return res.status(404).json({ msg: "Company not found" });

        const newVal = !company.settings?.isPassportPrivate;

        // Use findOneAndUpdate to bypass general validation
        await Company.findOneAndUpdate(
            { _id: req.user.companyId },
            { $set: { "settings.isPassportPrivate": newVal } },
            { new: true, runValidators: false }
        );

        res.status(StatusCodes.OK).json({
            success: true,
            isPassportPrivate: newVal
        });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Server error" });
    }
};

// 2. Change Email
const changeEmail = async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide a new email" });

    const emailExists = await User.findOne({ email: newEmail.toLowerCase().trim() });
    if (emailExists) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Email already in use" });

    // Bypass address/contact validation using findByIdAndUpdate
    const user = await User.findByIdAndUpdate(
        req.user._id || req.user.userId,
        { $set: { email: newEmail.toLowerCase().trim() } },
        { new: true, runValidators: false }
    );

    res.status(StatusCodes.OK).json({ success: true, msg: "Email updated successfully" });
};

// 3. Billing Info
const getBillingInfo = async (req, res) => {
    const company = await Company.findById(req.user.companyId).select('billing');
    if (!company) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Billing info not found" });

    const billing = company.billing || {};
    const status = (billing.expiryDate && new Date() > new Date(billing.expiryDate)) ? 'Expired' : 'Active';

    res.status(StatusCodes.OK).json({
        plan: billing.plan || 'Standard',
        expiryDate: billing.expiryDate,
        status: status
    });
};

// 4. Toggle Block/Unblock
const toggleBlockEmployee = async (req, res) => {
    const { employeeId } = req.params;
    const currentUserId = req.user._id || req.user.userId;

    if (employeeId === currentUserId.toString()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "You cannot restrict yourself" });
    }

    const targetUser = await User.findById(employeeId);
    if (!targetUser) return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });

    const updatedUser = await User.findByIdAndUpdate(
        employeeId,
        { $set: { isBlocked: !targetUser.isBlocked } },
        { new: true, runValidators: false }
    );

    res.status(StatusCodes.OK).json({
        success: true,
        msg: updatedUser.isBlocked ? `Access restricted` : `Access restored`,
        isBlocked: updatedUser.isBlocked
    });
};

// 5. Get ALL Employees
const getBlockedEmployees = async (req, res) => {
    try {
        const employees = await User.find({
            companyId: req.user.companyId,
            role: 'employee'
        }).select('fullName email isBlocked createdAt').sort({ createdAt: -1 });

        res.status(StatusCodes.OK).json({ success: true, data: employees });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Failed to fetch members" });
    }
};

// 6. Update Notifications (MASTER SWITCH FIX)
const updateNotificationSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        const userId = req.user._id || req.user.userId;

        // Use findByIdAndUpdate + $set to avoid triggering Address/Contact validation
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { notificationSettings: settings } },
            { new: true, runValidators: false }
        );

        res.status(StatusCodes.OK).json({
            success: true,
            data: updatedUser.notificationSettings
        });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

module.exports = {
    togglePassportPrivacy,
    changeEmail,
    getBillingInfo,
    toggleBlockEmployee,
    getBlockedEmployees,
    updateNotificationSettings
};