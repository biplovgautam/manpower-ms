const mongoose = require('mongoose');

const SubAgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  contact: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending'], 
    default: 'active',
    lowercase: true 
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  // ADDED THIS FIELD - MUST BE IN SCHEMA TO SAVE TO DB
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalWorkersBrought: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SubAgent', SubAgentSchema);