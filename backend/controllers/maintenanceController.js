const Maintenance = require('../models/Maintenance');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private
exports.getMaintenance = asyncHandler(async (req, res, next) => {
  const maintenance = await Maintenance.find().populate('equipment').populate('technician');

  res.status(200).json({
    success: true,
    count: maintenance.length,
     maintenance
  });
});

// @desc    Get single maintenance record
// @route   GET /api/maintenance/:id
// @access  Private
exports.getSingleMaintenance = asyncHandler(async (req, res, next) => {
  const maintenance = await Maintenance.findById(req.params.id).populate('equipment').populate('technician');

  if (!maintenance) {
    return next(new ErrorResponse(`Maintenance record not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
     maintenance
  });
});

// @desc    Create new maintenance record
// @route   POST /api/maintenance
// @access  Private
exports.createMaintenance = asyncHandler(async (req, res, next) => {
  const maintenance = await Maintenance.create(req.body);

  res.status(201).json({
    success: true,
     maintenance
  });
});

// @desc    Update maintenance record
// @route   PUT /api/maintenance/:id
// @access  Private
exports.updateMaintenance = asyncHandler(async (req, res, next) => {
  let maintenance = await Maintenance.findById(req.params.id);

  if (!maintenance) {
    return next(new ErrorResponse(`Maintenance record not found with id of ${req.params.id}`, 404));
  }

  maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
     maintenance
  });
});

// @desc    Delete maintenance record
// @route   DELETE /api/maintenance/:id
// @access  Private
exports.deleteMaintenance = asyncHandler(async (req, res, next) => {
  const maintenance = await Maintenance.findById(req.params.id);

  if (!maintenance) {
    return next(new ErrorResponse(`Maintenance record not found with id of ${req.params.id}`, 404));
  }

  await maintenance.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});