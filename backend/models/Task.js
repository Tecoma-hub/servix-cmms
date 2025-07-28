// backend/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Task assignee is required']
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Task assigner is required']
  },
  equipment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Equipment',
    required: [true, 'Equipment is required']
  },
  type: {
    type: String,
    enum: ['Maintenance', 'Repair', 'Calibration', 'Inspection'],
    required: [true, 'Task type is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);