// models/Reminders.js
const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
    content: { type: String, required: [true, 'Please provide reminder content'], trim: true },
    category: { type: String, enum: ['general', 'employer', 'worker', 'job-demand', 'sub-agent'], default: 'general' },
    targetDate: { type: Date, default: null },
    attachment: { type: String, default: null },
    linkedEntityId: { type: mongoose.Schema.Types.ObjectId, refPath: 'linkedEntityModel', default: null },
    linkedEntityModel: { type: String, enum: ['Employer', 'Worker', 'JobDemand', 'SubAgent', null], default: null },
    reason: { type: String, default: null },
    isCompleted: { type: Boolean, default: false },
    companyId: { type: mongoose.Schema.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Reminder', ReminderSchema);