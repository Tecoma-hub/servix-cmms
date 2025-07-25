const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true
  },
  hospitalId: {
    type: String,
    required: [true, 'Hospital ID is required'],
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Under Maintenance', 'Decommissioned'],
    default: 'Active'
  },
  sparePartsNeeded: [{
    type: String,
    trim: true
  }],
  comments: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['ICU', 'Radiology', 'Laboratory', 'Physiotherapy', 'Emergency', 'Surgery', 'Pharmacy', 'Administration']
  },
  critical: {
    type: Boolean,
    default: false
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date,
    required: [true, 'Next maintenance date is required']
  },
  maintenanceSchedule: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Biannually', 'Annually'],
    default: 'Monthly'
  },
  maintenanceType: {
    type: String,
    enum: ['Time-based', 'Usage-based'],
    default: 'Time-based'
  },
  usageHours: {
    type: Number,
    default: 0
  },
  maxUsageHours: {
    type: Number,
    default: 0
  },
  qrCode: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  purchaseDate: {
    type: Date
  },
  warrantyExpiry: {
    type: Date
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster searches
equipmentSchema.index({ name: 'text', brand: 'text', model: 'text', serialNumber: 'text', hospitalId: 'text' });
equipmentSchema.index({ department: 1, status: 1 });
equipmentSchema.index({ nextMaintenance: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);