const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['employer', 'demand', 'worker', 'agent', 'system'],
        default: 'system'
    },
    content: {
        type: String,
        required: true
    },
    isReadBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // Automatically deletes after 30 days (in seconds)
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);