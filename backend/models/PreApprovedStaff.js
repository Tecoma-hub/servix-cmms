// backend/models/PreApprovedStaff.js
const mongoose = require('mongoose');

const PreApprovedStaffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  serviceNumber: {
    type: String,
    required: [true, 'Please add a service number'],
    unique: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add a phone number'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Please add a role'],
    enum: ['Engineer', 'Admin', 'Technician', 'Staff'],
    default: 'Staff'
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  dateOfEmployment: {
    type: Date,
    required: [true, 'Please add date of employment']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PreApprovedStaff', PreApprovedStaffSchema);