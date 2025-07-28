// backend/controllers/maintenanceController.js
const Maintenance = require('../models/Maintenance');
const Task = require('../models/Task');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private
exports.getMaintenance = asyncHandler(async (req, res, next) => {
  const maintenance = await Maintenance.find().populate('equipment user');
  
  res.status(200).json({
    success: true,
    count: maintenance.length,
    maintenance: maintenance
  });
});

// @desc    Get single maintenance record
// @route   GET /api/maintenance/:id
// @access  Private
exports.getMaintenanceById = asyncHandler(async (req, res, next) => {
  const maintenance = await Maintenance.findById(req.params.id)
    .populate('equipment user');
  
  if (!maintenance) {
    return next(new ErrorResponse(`Maintenance record not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    maintenance: maintenance
  });
});

// @desc    Schedule preventive maintenance
// @route   POST /api/maintenance/schedule
// @access  Private
exports.schedulePreventive = asyncHandler(async (req, res, next) => {
  const { equipment, title, description, scheduledDate, frequency, duration, assignedTo, priority } = req.body;
  
  // Validate required fields
  if (!equipment || !title || !description || !scheduledDate) {
    return next(new ErrorResponse('Please provide equipment, title, description, and scheduled date', 400));
  }

  // Verify equipment exists
  const equipmentDoc = await Equipment.findById(equipment);
  if (!equipmentDoc) {
    return next(new ErrorResponse('Equipment not found', 404));
  }

  // Verify assigned user exists if specified
  let assignedUser = null;
  if (assignedTo) {
    assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return next(new ErrorResponse('Assigned user not found', 404));
    }
  }

  // Create maintenance schedule
  const maintenance = await Maintenance.create({
    ...req.body,
    type: 'Preventive',
    status: 'Scheduled',
    createdBy: req.user.id
  });

  // Create a task for this maintenance
  const task = await Task.create({
    title: title,
    description: description,
    assignedTo: assignedTo,
    assignedBy: req.user.id,
    equipment: equipment,
    type: 'Maintenance',
    status: 'Pending',
    priority: priority,
    deadline: scheduledDate
  });

  res.status(201).json({
    success: true,
    maintenance: maintenance,
    task: task
  });
});

// @desc    Report equipment issue
// @route   POST /api/maintenance/report
// @access  Private
exports.reportIssue = asyncHandler(async (req, res, next) => {
  const { equipment, title, description, severity, location, reportedBy } = req.body;
  
  // Validate required fields
  if (!equipment || !title || !description) {
    return next(new ErrorResponse('Please provide equipment, title, and description', 400));
  }

  // Verify equipment exists
  const equipmentDoc = await Equipment.findById(equipment);
  if (!equipmentDoc) {
    return next(new ErrorResponse('Equipment not found', 404));
  }

  // Create issue report
  const issue = await Maintenance.create({
    ...req.body,
    type: 'Issue',
    status: 'Reported',
    reportedBy: reportedBy || req.user.name,
    createdBy: req.user.id
  });

  // Create a high-priority task for this issue
  const task = await Task.create({
    title: `URGENT: ${title}`,
    description: description,
    assignedTo: null, // Will be assigned by manager
    assignedBy: req.user.id,
    equipment: equipment,
    type: 'Repair',
    status: 'Pending',
    priority: severity === 'Critical' ? 'High' : severity,
    deadline: new Date(Date.now() + (severity === 'Critical' ? 24 : 72) * 60 * 60 * 1000) // 1-3 days based on severity
  });

  res.status(201).json({
    success: true,
    issue: issue,
    task: task
  });
});

// @desc    Update maintenance record
// @route   PUT /api/maintenance/:id
// @access  Private
exports.updateMaintenance = asyncHandler(async (req, res, next) => {
  const maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!maintenance) {
    return next(new ErrorResponse(`Maintenance record not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    maintenance: maintenance
  });
});

// @desc    Delete maintenance record
// @route   DELETE /api/maintenance/:id
// @access  Private
exports.deleteMaintenance = asyncHandler(async (req, res, next) => {
  const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
  
  if (!maintenance) {
    return next(new ErrorResponse(`Maintenance record not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
     data: {}
  });
});