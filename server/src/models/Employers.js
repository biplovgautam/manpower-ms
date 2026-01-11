const mongoose = require('mongoose');

const EmployerSchema = new mongoose.Schema({
  employerName: {
    type: String,
    required: [true, 'Please provide employer name'],
    trim: true
  },
  country: { type: String, required: [true, 'Please provide country'] },
  contact: { type: String, required: [true, 'Please provide contact number'] },
  address: { type: String, required: [true, 'Please provide address'] },
  status: { type: String, default: 'active' },
  notes: { type: String },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
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
  // CRITICAL: This makes virtuals visible in your JSON response
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for Total Job Demands
EmployerSchema.virtual('totalJobDemands', {
  ref: 'JobDemand',
  localField: '_id',
  foreignField: 'employerId', 
  count: true 
});

// Virtual for Total Hires (Workers)
EmployerSchema.virtual('totalHires', {
  ref: 'Worker',
  localField: '_id',
  foreignField: 'employerId', 
  count: true
});

module.exports = mongoose.model('Employer', EmployerSchema);