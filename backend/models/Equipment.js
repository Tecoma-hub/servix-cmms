// backend/models/Equipment.js
const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  serialNumber: {
    type: String,
    required: [true, 'Please add a serial number'],
    unique: true,
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Please add a model'],
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Please add a manufacturer'],
    trim: true
  },
  installationDate: {
    type: Date,
    required: [true, 'Please add an installation date']
  },
  warrantyExpiry: {
    type: Date
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Diagnostic', 'Therapeutic', 'Monitoring', 'Life Support', 'Electromedical'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Serviceable', 'Under Maintenance', 'Unserviceable', 'Decommissioned', 'Auctioned'],
    default: 'Serviceable',
    required: true
  },
  previousStatus: {
    type: String,
    enum: ['Serviceable', 'Under Maintenance', 'Unserviceable', 'Decommissioned', 'Auctioned']
  },
  nextPreventiveMaintenance: {
    type: Date
  },
  maintenanceHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceHistory'
    }
  ],
  lastMaintenanceDate: {
    type: Date
  },
  maintenanceIntervalDays: {
    type: Number,
    default: 90
  },
  specifications: {
    type: Map,
    of: String
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Equipment', EquipmentSchema);