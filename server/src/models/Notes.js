const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Please provide note content'],
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'employer', 'worker', 'job-demand', 'reminder'],
        default: 'general'
    },
    // --- ADDED FIELD FOR DEADLINES ---
    targetDate: {
        type: Date,
        default: null
    },
    // ---------------------------------
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
    // This ensures that when we send data to frontend, virtuals like 'id' are included
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Note', NoteSchema);