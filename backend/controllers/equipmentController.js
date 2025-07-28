// backend/controllers/equipmentController.js
const Equipment = require('../models/Equipment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Private
exports.getEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.find();
  
  res.status(200).json({
    success: true,
    count: equipment.length,
    data: equipment
  });
});

// @desc    Get equipment by department
// @route   GET /api/equipment/department/:department
// @access  Private
exports.getEquipmentByDepartment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.find({ department: req.params.department });
  
  res.status(200).json({
    success: true,
    count: equipment.length,
    department: req.params.department,
    data: equipment
  });
});

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Private
exports.getEquipmentById = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return next(new ErrorResponse(`Equipment not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: equipment
  });
});

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private
exports.createEquipment = asyncHandler(async (req, res, next) => {
  // Add createdBy field
  req.body.createdBy = req.user.id;
  
  const equipment = await Equipment.create(req.body);
  
  res.status(201).json({
    success: true,
    data: equipment
  });
});

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private
exports.updateEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return next(new ErrorResponse(`Equipment not found with id of ${req.params.id}`, 404));
  }

  // Check if status is being changed
  if (req.body.status && req.body.status !== equipment.status) {
    // Add status change information
    req.body.changedBy = req.user.id;
    req.body.statusChangeNotes = req.body.statusChangeNotes || `Status changed from ${equipment.status} to ${req.body.status}`;
  }

  const updatedEquipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: updatedEquipment
  });
});

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private
exports.deleteEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findByIdAndDelete(req.params.id);
  
  if (!equipment) {
    return next(new ErrorResponse(`Equipment not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});