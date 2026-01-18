// models/JobDemand.js
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('JobDemand', JobDemandSchema);