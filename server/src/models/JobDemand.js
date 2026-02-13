const mongoose = require('mongoose');

const JobDemandSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: [true, 'Please select an employer'],
  },
  jobTitle: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
  },
  requiredWorkers: {
    type: Number,
    required: [true, 'Please specify the number of workers'],
  },
  tenure: {
    type: String,
    required: [true, 'Please specify the contract tenure (e.g., 2 Years)'],
  },
  // Array of Assigned Candidates
  workers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
  }],
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  salary: {
    type: String,
    required: [true, 'Please add salary details'],
  },
  skills: {
    type: [String],
    default: [],
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline'],
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed'],
    default: 'open',
    lowercase: true, // CRITICAL: Ensures "Open" and "open" are treated the same in reports
    trim: true
  },
  documents: [{
    name: String,
    url: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true, // Handles createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS ---

// Get count of assigned workers automatically
JobDemandSchema.virtual('assignedCount').get(function() {
  return this.workers ? this.workers.length : 0;
});

// Calculate remaining vacancies
JobDemandSchema.virtual('remainingPositions').get(function() {
  const assigned = this.workers ? this.workers.length : 0;
  return Math.max(0, this.requiredWorkers - assigned);
});

// --- INDEXING ---
// These ensure your Admin Dashboard aggregations run instantly
JobDemandSchema.index({ companyId: 1, createdAt: -1 });
JobDemandSchema.index({ status: 1 });
JobDemandSchema.index({ employerId: 1 });

module.exports = mongoose.model('JobDemand', JobDemandSchema);