// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  serviceNumber: {
    type: String,
    required: [true, 'Service number is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please add a valid email'
    ],
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [15, 'Phone number cannot be more than 15 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['Technician', 'Engineer', 'Admin'],
    default: 'Technician'
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    default: 'TSEU'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);