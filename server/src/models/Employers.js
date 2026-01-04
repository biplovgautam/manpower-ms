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
  status: { type: String, default: 'active' }, // Added status field
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
  toJSON: { virtuals: true }, // Essential: makes virtuals show up in JSON
  toObject: { virtuals: true }
});

// --- NEW: VIRTUALS ---

// Automatically link to JobDemands collection (assumes your JobDemand model has an 'employer' field)
EmployerSchema.virtual('jobDemands', {
  ref: 'JobDemand',
  localField: '_id',
  foreignField: 'employer',
  count: true // This just returns the number
});

// Automatically count hires (assumes your Worker model has an 'employerId' field)
EmployerSchema.virtual('totalHiresCount', {
  ref: 'Worker',
  localField: '_id',
  foreignField: 'employerId',
  count: true
});

module.exports = mongoose.model('Employer', EmployerSchema);