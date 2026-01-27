const Support = require('../models/Support');

// @desc    Submit new feedback/bug
// @route   POST /api/support
// @access  Private
exports.submitFeedback = async (req, res) => {
    try {
        const { category, message, imageUrl } = req.body;

        // Debug log to verify image arrival in console
        if (imageUrl) {
            console.log(`📸 Image received for category: ${category} (Size approx: ${(imageUrl.length / 1024 / 1024).toFixed(2)} MB)`);
        }

        const feedback = await Support.create({
            sender: req.user._id,
            senderName: req.user.fullName,
            senderRole: req.user.role,
            category,
            message,
            attachments: imageUrl ? [imageUrl] : []
        });

        res.status(201).json({ success: true, data: feedback });
    } catch (error) {
        console.error("❌ Submission error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all feedback for Super Admin
// @route   GET /api/support/all
// @access  Private (Super Admin Only)
exports.getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Support.find()
            .populate('sender', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get reports submitted by the logged-in user (History)
// @route   GET /api/support/my-reports
// @access  Private
exports.getMyReports = async (req, res) => {
    try {
        const reports = await Support.find({ sender: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};