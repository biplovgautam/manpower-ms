const mongoose = require('mongoose');

const EmployerSchema = new mongoose.Schema({
  employerName: { type: String, required: true },
  country: { type: String, required: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
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
}, { timestamps: true });

module.exports = mongoose.model('Employer', EmployerSchema);