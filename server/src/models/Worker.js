const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  passportNumber: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, default: 'Nepal' },

  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer', // Matches your Employer model name
    required: true,
  },
  jobDemandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDemand',
    required: true,
  },
  // CHANGED: From String to ObjectId for population
  subAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubAgent'
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'active'],
    default: 'pending',
    lowercase: true,
  },
  currentStage: { type: String, default: 'interview' },
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
  createdBy: { type: String, default: 'emp1' },
}, { timestamps: true });

module.exports = mongoose.model('Worker', WorkerSchema);