const mongoose = require('mongoose');

const SupportSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: String,
    senderRole: String,
    category: {
        type: String,
        enum: ['bug', 'help', 'error', 'feedback'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    attachments: [String], // Array of Base64 strings or URLs
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Support', SupportSchema);