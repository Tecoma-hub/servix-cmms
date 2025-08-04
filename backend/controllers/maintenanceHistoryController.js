// backend/controllers/maintenanceHistoryController.js
const MaintenanceHistory = require('../models/MaintenanceHistory');
const Equipment = require('../models/Equipment');
const Task = require('../models/Task');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create maintenance history record
// @route   POST /api/maintenance-history
// @access  Private
exports.createMaintenanceHistory = asyncHandler(async (req, res, next) => {
  const {
    equipmentId,
    taskId,
    problemDescription,
    resolutionSummary,
    dateReported,
    dateCompleted,
    sparePartsUsed,
    engineers,
    technicians
  } = req.body;

  // Validate required fields
  if (!equipmentId || !problemDescription || !resolutionSummary) {
    return next(new ErrorResponse('Please provide equipment ID, problem description, and resolution summary', 400));
  }

  // Check if equipment exists
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment) {
    return next(new ErrorResponse('Equipment not found', 404));
  }

  // Validate task if provided
  let task = null;
  if (taskId) {
    task = await Task.findById(taskId);
    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }
  }

  // Process spare parts (without inventory validation)
  let processedSpareParts = [];
  let totalCost = 0;

  if (sparePartsUsed && sparePartsUsed.length > 0) {
    for (const part of sparePartsUsed) {
      // Just validate that required fields are present
      if (!part.partId || !part.partName || !part.quantity || !part.unitPrice) {
        return next(new ErrorResponse('Please provide part ID, name, quantity, and unit price for spare parts', 400));
      }

      if (part.quantity <= 0) {
        return next(new ErrorResponse('Spare part quantity must be greater than 0', 400));
      }

      if (part.unitPrice <= 0) {
        return next(new ErrorResponse('Spare part unit price must be greater than 0', 400));
      }

      // Add to processed parts
      processedSpareParts.push({
        partId: part.partId,
        partName: part.partName,
        quantity: part.quantity,
        unitPrice: part.unitPrice
      });

      totalCost += part.quantity * part.unitPrice;
    }
  }

  // Process engineers
  let processedEngineers = [];
  if (engineers && engineers.length > 0) {
    for (const engineerId of engineers) {
      const user = await User.findById(engineerId);
      if (!user) {
        return next(new ErrorResponse(`Engineer with ID ${engineerId} not found`, 404));
      }
      if (user.role !== 'Engineer' && user.role !== 'Admin') {
        return next(new ErrorResponse(`User ${user.name} is not authorized as an engineer`, 400));
      }
      processedEngineers.push({
        userId: engineerId,
        name: user.name
      });
    }
  }

  // Process technicians
  let processedTechnicians = [];
  if (technicians && technicians.length > 0) {
    for (const technicianId of technicians) {
      const user = await User.findById(technicianId);
      if (!user) {
        return next(new ErrorResponse(`Technician with ID ${technicianId} not found`, 404));
      }
      if (user.role !== 'Technician' && user.role !== 'Engineer' && user.role !== 'Admin') {
        return next(new ErrorResponse(`User ${user.name} is not authorized as a technician`, 400));
      }
      processedTechnicians.push({
        userId: technicianId,
        name: user.name
      });
    }
  }

  // Create maintenance history record
  const maintenanceHistory = await MaintenanceHistory.create({
    equipmentId,
    taskId,
    problemDescription,
    resolutionSummary,
    dateReported: dateReported || Date.now(),
    dateCompleted: dateCompleted || Date.now(),
    sparePartsUsed: processedSpareParts,
    engineers: processedEngineers,
    technicians: processedTechnicians,
    totalCost,
    createdBy: req.user.id
  });

  // Update equipment
  equipment.maintenanceHistory.push(maintenanceHistory._id);
  equipment.lastMaintenanceDate = maintenanceHistory.dateCompleted;
  
  // Update status if needed
  if (equipment.status === 'Under Maintenance') {
    equipment.status = 'Operational';
  }
  
  await equipment.save();

  // Update task status if task was provided
  if (task) {
    task.status = 'Completed';
    task.completedAt = maintenanceHistory.dateCompleted;
    await task.save();
  }

  res.status(201).json({
    success: true,
     maintenanceHistory
  });
});

// @desc    Get maintenance history for equipment
// @route   GET /api/maintenance-history/:equipmentId
// @access  Private
exports.getMaintenanceHistory = asyncHandler(async (req, res, next) => {
  const { equipmentId } = req.params;

  // Check if equipment exists
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment) {
    return next(new ErrorResponse('Equipment not found', 404));
  }

  // Get maintenance history with populated references
  const history = await MaintenanceHistory.find({ equipmentId })
    .populate('equipmentId', 'name serialNumber model')
    .populate('taskId', 'title priority')
    .populate('engineers.userId', 'name role')
    .populate('technicians.userId', 'name role')
    .populate('createdBy', 'name role')
    .sort('-dateCompleted');

  res.status(200).json({
    success: true,
    count: history.length,
     history
  });
});

// @desc    Get maintenance history by ID
// @route   GET /api/maintenance-history/:id
// @access  Private
exports.getMaintenanceHistoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const history = await MaintenanceHistory.findById(id)
    .populate('equipmentId', 'name serialNumber model')
    .populate('taskId', 'title priority')
    .populate('engineers.userId', 'name role')
    .populate('technicians.userId', 'name role')
    .populate('createdBy', 'name role');

  if (!history) {
    return next(new ErrorResponse('Maintenance history record not found', 404));
  }

  res.status(200).json({
    success: true,
     history
  });
});