// backend/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  taskType: {
    type: String,
    enum: ['Repair', 'Install', 'Inspect', 'Assess', 'Calibrate'],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  faultDescription: {
    type: String,
    default: ''
  },
  comments: {
    type: String,
    default: ''
  },
  spareParts: [{
    name: String,
    quantity: Number,
    description: String
  }],
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update equipment status when task status changes
taskSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const Equipment = require('./Equipment');
    
    // When task is assigned, set equipment to Unserviceable
    if (this.status === 'Pending' && this.isNew) {
      await Equipment.findByIdAndUpdate(this.equipment, {
        status: 'Unserviceable'
      });
    }
    
    // When task is completed or cancelled, don't change status here
    // Technician will update equipment status after completion
  }
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);