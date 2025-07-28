// backend/models/Equipment.js
const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['Serviceable', 'Unserviceable', 'Decommissioned', 'Auctioned']
  },
  changedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
});

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  brand: {
    type: String,
    required: [true, 'Please add a brand'],
    trim: true,
    maxlength: [50, 'Brand cannot be more than 50 characters']
  },
  model: {
    type: String,
    required: [true, 'Please add a model'],
    trim: true,
    maxlength: [50, 'Model cannot be more than 50 characters']
  },
  serialNumber: {
    type: String,
    required: [true, 'Please add a serial number'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
    enum: [
      'TSEU', 'MEU', 'PEU', 'DEPARTMENT OF ANATOMICAL PATHOLOGY', 'IT OFFICE', 'SIMANGO',
      'ANAESTHESIA CLINIC', 'HAEMATOLOGY DAYCARE CLINIC', 'TAMAKLO', 'ANOFF', 'CTU', 'ICU',
      'DIALYSIS', 'MAIN THEATRE', 'CSSD', 'DESPITE', 'ALLIED SURGERY', 'EASMON', 'NEURO SURGERY',
      'YEBUAH WARD', 'YAA ASANTEWAA', 'JAMES COLE', 'BANDOH', 'GHANDI', 'OPOKU', 'GEU',
      'DEBRAH WARD', 'BLOOD BANK', 'MOPD', 'SOPD', 'POPD', 'FOPD', 'DENTAL', 'PUBLIC HEALTH',
      'POLYCLINIC', 'ENT', 'OPTHAMOLOGY', 'PATHOLOGY DEPARTMENT (LAB)', 'RADIOLOGY DEPARTMENT',
      'PHYSIOTHERAPY', '37 CHEMIST', 'MSED', 'DIETETICS DEPARTMENT', 'BIRTH AND DEATH', 'LAUNDRY',
      'BMED', 'PHARMACY DIVISION', 'MATERNITY THEATRE', 'NICU', 'LABOUR', 'MILITARY POLYCLINIC',
      'OXYGEN PLANT'
    ]
  },
  status: {
    type: String,
    required: [true, 'Please add a status'],
    enum: ['Serviceable', 'Unserviceable', 'Decommissioned', 'Auctioned'],
    default: 'Serviceable'
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    trim: true
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Please add a purchase date']
  },
  warrantyExpiry: {
    type: Date
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  },
  maintenanceHistory: [
    {
      date: {
        type: Date,
        default: Date.now
      },
      description: String,
      technician: String,
      cost: Number
    }
  ],
  statusHistory: [statusHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update status and add to history when status changes
equipmentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== this.get('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.changedBy || this.createdBy,
      notes: this.statusChangeNotes
    });
  }
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);