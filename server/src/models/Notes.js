const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Please provide note content'],
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'employer', 'worker', 'job-demand', 'sub-agent', 'reminder'],
        default: 'general'
    },
    targetDate: {
        type: Date,
        default: null
    },
    attachment: {
        type: String,
        default: null
    },
    linkedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'categoryRef',
        default: null
    },
    // categoryRef stores the model name used by refPath
    categoryRef: {
        type: String,
        enum: ['Employer', 'Worker', 'JobDemand', 'SubAgent', null],
        default: null
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    companyId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Company',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Optional: virtual to expose populated linkedEntity in a consistent field name if preferred
// (If you prefer using .populate('linkedEntityId') directly, this virtual is not strictly necessary.)
NoteSchema.virtual('linkedEntity', {
    ref: doc => doc.categoryRef, // For Mongoose v6+ this form is supported for virtual population
    localField: 'linkedEntityId',
    foreignField: '_id',
    justOne: true
});

module.exports = mongoose.model('Note', NoteSchema);