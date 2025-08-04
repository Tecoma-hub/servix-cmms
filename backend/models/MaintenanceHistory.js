// backend/models/MaintenanceHistory.js
const mongoose = require('mongoose');

const MaintenanceHistorySchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  problemDescription: {
    type: String,
    required: true,
    trim: true
  },
  resolutionSummary: {
    type: String,
    required: true,
    trim: true
  },
  dateReported: {
    type: Date,
    required: true,
    default: Date.now
  },
  dateCompleted: {
    type: Date,
    required: true,
    default: Date.now
  },
  sparePartsUsed: [
    {
      partId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
      },
      partName: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unitPrice: {
        type: Number,
        required: true
      }
    }
  ],
  engineers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      }
    }
  ],
  technicians: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      }
    }
  ],
  totalCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending Review'],
    default: 'Completed'
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

// Pre-save hook to calculate total cost
MaintenanceHistorySchema.pre('save', function(next) {
  // Calculate total cost based on spare parts used
  this.totalCost = this.sparePartsUsed.reduce((total, part) => {
    return total + (part.quantity * part.unitPrice);
  }, 0);
  
  next();
});

module.exports = mongoose.model('MaintenanceHistory', MaintenanceHistorySchema);