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
  // ADDED: The workers field to store an array of Worker IDs
  // This allows the .populate('workers') call in your controller to work
  workers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker', // Ensure this matches exactly with your Worker model name
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
    enum: ['open', 'pending', 'in-progress', 'closed'],
    default: 'open',
  },
  documents: [{
    name: String,
    url: String,
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
  // If you decide to use Virtuals later, these options are helpful:
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('JobDemand', JobDemandSchema);