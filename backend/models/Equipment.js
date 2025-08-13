// backend/models/Equipment.js
const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Serviceable', 'Under Maintenance', 'Unserviceable', 'Decommissioned', 'Auctioned'],
    default: 'Serviceable'
  },
  manufacturer: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  installationDate: {
    type: Date,
    required: true
  },
  warrantyExpiry: {
    type: Date
  },
  category: {
    type: String,
    required: true // Ensure this field is required
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Equipment', equipmentSchema);