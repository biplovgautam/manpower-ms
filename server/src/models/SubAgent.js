// models/SubAgent.js
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
  // ADD THIS FIELD BELOW
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company', // Ensure this matches your Company model name
    required: true
  },
  totalWorkersBrought: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SubAgent', SubAgentSchema);