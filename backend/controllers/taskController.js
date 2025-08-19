// backend/controllers/taskController.js
const Task = require('../models/Task');
const Equipment = require('../models/Equipment');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// socket helper (optional safe import)
let io;
try {
  io = require('../socket').io; // if you expose io via a small helper
} catch { /* no-op */ }
const emit = (evt, payload) => { if (io) io.emit(evt, payload); };

/**
 * GET /api/tasks
 * Engineers/Admins: all tasks
 * Technicians: only tasks assigned to them
 */
exports.getTasks = asyncHandler(async (req, res) => {
  const filter = (req.user.role === 'Technician')
    ? { assignedTo: req.user._id }
    : {};

  const tasks = await Task.find(filter)
    .populate('equipment', 'name serialNumber status')
    .populate('assignedTo', 'name role')
    .populate('assignedBy', 'name role')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: tasks.length, tasks });
});

/**
 * GET /api/tasks/:id
 */
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('equipment', 'name serialNumber status')
    .populate('assignedTo', 'name role')
    .populate('assignedBy', 'name role');

  if (!task) return next(new ErrorResponse('Task not found', 404));
  // enforce tech can only access own task
  if (req.user.role === 'Technician' &&
      String(task.assignedTo) !== String(req.user._id)) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  res.status(200).json({ success: true, task });
});

/**
 * POST /api/tasks
 * Create (Engineer/Admin)
 */
exports.createTask = asyncHandler(async (req, res, next) => {
  if (!req.user?.id) return next(new ErrorResponse('User not authenticated', 401));

  // Force creator and assigner
  req.body.createdBy = req.user.id;
  req.body.assignedBy = req.user.id;

  // Normalize preventive flags
  if (req.body.taskType === 'Preventive') {
    req.body.isPreventive = true;
  } else {
    req.body.isPreventive = false;
    req.body.pmType = undefined;
    req.body.pmInterval = undefined;
  }

  const task = await Task.create(req.body);

  // Initial equipment status at assignment:
  // - Install => keep Serviceable
  // - Others (Repair/Calibrate/Assess/Inspect/Preventive) => Under Maintenance
  if (task.taskType !== 'Install') {
    await Equipment.findByIdAndUpdate(task.equipment, { status: 'Under Maintenance' });
  }

  emit('task:created', { taskId: task._id });
  res.status(201).json({ success: true, task });
});

/**
 * PUT /api/tasks/:id/status
 * Tech updates set needsCertification=true and DO NOT touch equipment
 * Engineer/Admin update status; equipment still only changes on /certify
 */
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) return next(new ErrorResponse('Task not found', 404));

  // Tech can only update own task
  if (req.user.role === 'Technician' &&
      String(task.assignedTo) !== String(req.user._id)) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  task.status = status;

  // Tech change requires certification
  if (req.user.role === 'Technician') {
    task.needsCertification = true;
  }

  if (status === 'Completed') task.completedDate = new Date();
  await task.save();

  emit('task:updated', { taskId: task._id });
  res.status(200).json({ success: true, task });
});

/**
 * PUT /api/tasks/:id/work
 * Save tech's work details + flag for certification
 */
exports.saveWork = asyncHandler(async (req, res, next) => {
  const { faultDescription, repairDetails, sparePartsUsed } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) return next(new ErrorResponse('Task not found', 404));

  // Tech can only update own task
  if (req.user.role === 'Technician' &&
      String(task.assignedTo) !== String(req.user._id)) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  task.faultDescription = faultDescription ?? task.faultDescription;
  task.repairDetails = repairDetails ?? task.repairDetails;
  if (Array.isArray(sparePartsUsed)) task.spareParts = sparePartsUsed;

  // Flag for certification when tech submits work
  if (req.user.role === 'Technician') {
    task.needsCertification = true;
  }

  await task.save();
  emit('task:updated', { taskId: task._id });
  res.status(200).json({ success: true, task });
});

/**
 * POST /api/tasks/:id/certify
 * Engineer/Admin only → apply equipment status mapping and clear flag
 */
exports.certify = asyncHandler(async (req, res, next) => {
  if (!['Engineer', 'Admin'].includes(req.user.role)) {
    return next(new ErrorResponse('Only Engineers/Admins can certify', 403));
  }

  const task = await Task.findById(req.params.id);
  if (!task) return next(new ErrorResponse('Task not found', 404));

  task.needsCertification = false;
  task.certifiedBy = req.user._id;
  task.certifiedAt = new Date();
  await task.save();

  // Apply mapping to equipment *now* that it’s certified
  let newEquipmentStatus = null;
  switch (task.status) {
    case 'Pending':
    case 'In Progress':
      newEquipmentStatus = (task.taskType === 'Install') ? 'Serviceable' : 'Under Maintenance';
      break;
    case 'Completed':
      newEquipmentStatus = 'Serviceable';
      break;
    case 'Cancelled':
      newEquipmentStatus = 'Decommissioned';
      break;
  }
  if (newEquipmentStatus) {
    await Equipment.findByIdAndUpdate(task.equipment, { status: newEquipmentStatus });
  }

  emit('task:certified', { taskId: task._id });
  res.status(200).json({ success: true, task });
});

/**
 * DELETE /api/tasks/:id
 */
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new ErrorResponse('Task not found', 404));

  await task.remove();
  emit('task:deleted', { taskId: task._id });
  res.status(200).json({ success: true, message: 'Task deleted' });
});
