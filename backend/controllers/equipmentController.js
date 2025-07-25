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

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Private
exports.getSingleEquipment = asyncHandler(async (req, res, next) => {
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
  let equipment = await Equipment.findById(req.params.id);

  if (!equipment) {
    return next(new ErrorResponse(`Equipment not found with id of ${req.params.id}`, 404));
  }

  equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: equipment
  });
});

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private
exports.deleteEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id);

  if (!equipment) {
    return next(new ErrorResponse(`Equipment not found with id of ${req.params.id}`, 404));
  }

  await equipment.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});