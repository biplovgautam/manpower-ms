const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  passportNumber: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String },
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
    ref: 'SubAgent',
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'deployed', 'active', 'rejected'],
    default: 'pending',
    lowercase: true,
  },

  // UPDATED: Added more stages to match the frontend 11-stage pipeline
  currentStage: {
    type: String,
    enum: [
      'document-collection',
      'document-verification',
      'interview',
      'medical-examination',
      'police-clearance',
      'training',
      'visa-application',
      'visa-approval',
      'ticket-booking',
      'pre-departure-orientation',
      'deployed'
    ],
    default: 'document-collection'
  },

  // UPDATED: Added category, fileName, and fileSize to support the new upload UI
  documents: [
    {
      category: String, // e.g., 'passport', 'medical-certificate'
      name: String,     // Custom name given by user
      fileName: String, // Actual file name from disk
      fileSize: String,
      path: String,
      status: { type: String, default: 'pending' },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  stageTimeline: [
    {
      stage: String,
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'rejected'],
        default: 'pending',
      },
      date: { type: Date, default: Date.now },
      notes: String,
    },
  ],

  notes: String,

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

// Indexing for performance
WorkerSchema.index({ createdBy: 1 });
WorkerSchema.index({ companyId: 1 });
WorkerSchema.index({ passportNumber: 1 });

module.exports = mongoose.model('Worker', WorkerSchema);