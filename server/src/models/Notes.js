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
    // This connects the note to the specific company
    companyId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Company',
        required: true
    },
    // This tracks which employee wrote the note
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true }); // This automatically adds 'createdAt' and 'updatedAt'

module.exports = mongoose.model('Note', NoteSchema);