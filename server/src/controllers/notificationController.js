const Notification = require('../models/Notification');
const { StatusCodes } = require('http-status-codes');



// Add a default empty object to prevent "cannot destructure property of undefined" errors
const createNotification = async ({ companyId, createdBy, category, content } = {}) => {
    try {
        if (!companyId || !createdBy || !content) {
            console.error("Missing required fields for notification:", { companyId, createdBy, content });
            return;
        }

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
        const userId = req.user._id || req.user.userId;
        const { companyId } = req.user;

        // Add current user ID to isReadBy array for all notifications in their company
        await Notification.updateMany(
            {
                companyId,
                isReadBy: { $ne: userId } // Only update those not already read by this user
            },
            {
                $addToSet: { isReadBy: userId }
            }
        );

        res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

/**
 * @desc Get a statistical summary of activities for the last 7 days
 */
const getWeeklySummary = async (req, res) => {
    try {
        const { companyId } = req.user;

        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const summary = await Notification.aggregate([
            {
                $match: {
                    companyId: new mongoose.Types.ObjectId(companyId),
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        day: { $dayOfWeek: "$createdAt" },
                        category: "$category"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.category",
                    dailyCounts: {
                        $push: {
                            day: "$_id.day",
                            count: "$count"
                        }
                    },
                    total: { $sum: "$count" }
                }
            }
        ]);

        res.status(StatusCodes.OK).json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { createNotification, getNotifications, markAsRead, markAllAsRead, getWeeklySummary};