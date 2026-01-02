const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  passportNumber: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, default: 'Nepal' },

  // Relational IDs
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true,
  },
  jobDemandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDemand',
    required: true,
  },
  subAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Changed to User if sub-agents are in your User model
  },

  // SCRUM-10: Multi-tenant ownership
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // models/Worker.js
  status: {
    type: String,
    // ADD 'active' HERE
    enum: ['pending', 'processing', 'deployed', 'cancelled', 'active'],
    default: 'pending',
    lowercase: true,
  },
  currentStage: {
    type: String,
    enum: ['interview', 'medical', 'training', 'visa', 'flight'],
    default: 'interview'
  },

  documents: [
    {
      name: String,
      path: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  stageTimeline: [
    {
      stage: String,
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed'],
        default: 'pending',
      },
      date: { type: Date, default: Date.now },
      notes: String,
    },
  ],
  notes: String,

  // Tracking fields for the "Workers Managed" count
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, { timestamps: true });

// Indexing for faster counts in the Employee List
WorkerSchema.index({ createdBy: 1 });
WorkerSchema.index({ companyId: 1 });

module.exports = mongoose.model('Worker', WorkerSchema);