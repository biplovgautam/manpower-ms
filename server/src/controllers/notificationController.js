const Notification = require('../models/Notification');
const { StatusCodes } = require('http-status-codes');



const createNotification = async ({ companyId, createdBy, category, content }) => {
    try {
        await Notification.create({
            companyId,
            createdBy,
            category,
            content
        });
    } catch (error) {
        console.error("Notification creation failed:", error);
    }
};


// Get notifications for the logged-in user's company
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId;
        const notifications = await Notification.find({ companyId: req.user.companyId })
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(50); // Increased limit for better history

        res.status(StatusCodes.OK).json({ success: true, data: notifications });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error fetching notifications" });
    }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId;
        await Notification.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { isReadBy: userId } }
        );
        res.status(StatusCodes.OK).json({ success: true });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Update failed" });
    }
};

// Mark ALL notifications in company as read for this user
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId; // Get user ID from the auth middleware
        const companyId = req.user.companyId;

        // $addToSet adds the userId to the array ONLY if it's not already there
        await Notification.updateMany(
            {
                companyId: companyId,
                isReadBy: { $ne: userId }
            },
            { $addToSet: { isReadBy: userId } }
        );

        res.status(200).json({ success: true, message: "Notifications updated" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { createNotification, getNotifications, markAsRead, markAllAsRead };