const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Please provide content'],
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'employer', 'worker', 'job-demand', 'sub-agent', 'reminder', 'urgent'],
        default: 'general'
    },
    targetDate: { type: Date, default: null },
    attachment: { type: String, default: null },
    linkedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'categoryRef',
        default: null
    },
    categoryRef: {
        type: String,
        enum: ['Employer', 'Worker', 'JobDemand', 'SubAgent', null],
        default: null
    },
    isCompleted: { type: Boolean, default: false },
    companyId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Company',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // ADD THIS FIELD: This is the "Tag" field
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // If null, it's a general company note. If set, only they see it.
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Note', NoteSchema);