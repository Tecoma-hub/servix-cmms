const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'Equipment is required']
  },
  type: {
    type: String,
    enum: ['Preventive', 'Corrective', 'Emergency', 'Inspection'],
    required: [true, 'Maintenance type is required']
  },
  date: {
    type: Date,
    required: [true, 'Maintenance date is required']
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Technician is required']
  },
  engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duration: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  findings: {
    type: String,
    default: ''
  },
  actionsTaken: {
    type: String,
    default: ''
  },
  partsReplaced: [{
    part: String,
    quantity: Number,
    cost: Number
  }],
  recommendations: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'In Progress'],
    default: 'Completed'
  },
  nextMaintenanceDate: {
    type: Date
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  checklist: [{
    item: String,
    completed: {
      type: Boolean,
      default: true
    }
  }],
  cost: {
    type: Number,
    default: 0
  },
  downtimeHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for maintenance records
maintenanceSchema.index({ equipment: 1, date: -1 });
maintenanceSchema.index({ type: 1, date: -1 });
maintenanceSchema.index({ technician: 1, date: -1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);