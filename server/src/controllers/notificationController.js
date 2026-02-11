const Notification = require('../models/Notification'); 
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const { producer } = require('../utils/kafkaClient'); // Import the Kafka Producer

// Internal Helper for category consistency
const mapCategoryToUI = (cat) => {
    const map = {
        'general': 'System',
        'employer': 'Employer',
        'worker': 'Worker',
        'demand': 'Demand',
        'agent': 'Agent',
        'system': 'System'
    };
    return map[cat?.toLowerCase()] || 'System';
};

/**
 * Updated Helper: Saves to DB and Produces to Kafka
 */
const createNotification = async ({ companyId, createdBy, category, content } = {}) => {
    try {
        if (!companyId || !createdBy || !content) {
            console.error("Missing required fields for notification:", { companyId, createdBy, content });
            return;
        }

        // 1. Save to MongoDB (Persistent History)
        const notification = await Notification.create({
            companyId,
            createdBy,
            category: category?.toLowerCase() || 'general',
            content: content.trim()
        });

        // 2. Prepare Data for Kafka
        const populatedNotif = await notification.populate('createdBy', 'fullName');
        
        const kafkaPayload = {
            ...populatedNotif.toObject(),
            isRead: false,
            category: mapCategoryToUI(populatedNotif.category) 
        };

        // 3. Produce to Kafka Topic
        // The Bridge in index.js will pick this up and send it to Socket.io
        await producer.send({
            topic: 'notifications-topic',
            messages: [
                { 
                    key: String(companyId), 
                    value: JSON.stringify(kafkaPayload) 
                },
            ],
        });

        return notification;
    } catch (error) {
        console.error("❌ Kafka Notification Production failed:", error);
    }
};

const getNotifications = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const userId = String(req.user?._id || req.user?.userId || req.user?.id);

        const notifications = await Notification.find({ companyId })
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const updatedNotifications = notifications.map(notif => ({
            ...notif,
            category: mapCategoryToUI(notif.category),
            isRead: notif.isReadBy ? notif.isReadBy.map(id => String(id)).includes(userId) : false
        }));

        res.status(StatusCodes.OK).json({ success: true, data: updatedNotifications });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.userId || req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "User ID not found" });
        }

        const result = await Notification.updateMany(
            { companyId, isReadBy: { $ne: userId } },
            { $addToSet: { isReadBy: userId } }
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to mark notifications as read",
            error: error.message
        });
    }
};

const getWeeklySummary = async (req, res) => {
    try {
        const { companyId } = req.user;
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
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAllAsRead,
    getWeeklySummary
};