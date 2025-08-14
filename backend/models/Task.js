// backend/models/Task.js
const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    quantity: { type: Number, default: 1 },
    description: { type: String, trim: true }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },

  // Work classification
  taskType: {
    type: String,
    enum: ['Repair', 'Install', 'Inspect', 'Assess', 'Calibrate', 'Preventive'],
    required: true
  },
  // Preventive-only
  pmType: {
    type: String,
    enum: ['', 'Cleaning', 'Lubrication', 'Adjustment', 'Calibrations', 'Safety Testing', 'Filter Replacement'],
    default: ''
  },
  pmInterval: {
    type: String,
    enum: ['', 'Weekly', 'Monthly', 'Quarterly', 'Biannually', 'Annually'],
    default: ''
  },
  isPreventive: { type: Boolean, default: false },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },

  // Current task status (what the technician or engineer set last)
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },

  // Certification controls
  certified: { type: Boolean, default: false },
  awaitingCertification: { type: Boolean, default: false }, // true right after a tech update
  certifiedAt: { type: Date, default: null },
  certifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },

  // Work details
  faultDescription: { type: String, default: '' },
  repairDetails: { type: String, default: '' },
  spareParts: [sparePartSchema],

  dueDate: { type: Date },
  completedDate: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Keep updatedAt fresh
taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
