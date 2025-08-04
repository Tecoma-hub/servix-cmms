// backend/controllers/equipmentController.js
const Equipment = require('../models/Equipment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Private
exports.getAllEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.find();
  res.status(200).json({
    success: true,
     equipment
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
     equipment
  });
});

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private
exports.addEquipment = asyncHandler(async (req, res, next) => {
  // Validate required fields
  const requiredFields = ['name', 'manufacturer', 'model', 'serialNumber', 'installationDate'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return next(new ErrorResponse(`Please provide ${missingFields.join(', ')}`, 400));
  }

  // Check for duplicate serial number
  const existingEquipment = await Equipment.findOne({ serialNumber: req.body.serialNumber });
  if (existingEquipment) {
    return next(new ErrorResponse('Equipment with this serial number already exists', 400));
  }

  // Add createdBy field
  req.body.createdBy = req.user.id;

  const equipment = await Equipment.create(req.body);
  
  res.status(201).json({
    success: true,
     equipment
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

  // Check for duplicate serial number (except for the current equipment)
  if (req.body.serialNumber && req.body.serialNumber !== equipment.serialNumber) {
    const existingEquipment = await Equipment.findOne({ serialNumber: req.body.serialNumber });
    if (existingEquipment) {
      return next(new ErrorResponse('Equipment with this serial number already exists', 400));
    }
  }

  equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
     equipment
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

  res.status(200).json({ success: true, message: 'Equipment deleted' });
});