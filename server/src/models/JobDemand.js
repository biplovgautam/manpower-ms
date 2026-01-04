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
    enum: ['open', 'pending', 'in-progress' , 'closed'],
    default: 'open',
  },
  documents: [{
    name: String,
    url: String, // You would store the path to the file here
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
}, { timestamps: true });

module.exports = mongoose.model('JobDemand', JobDemandSchema);