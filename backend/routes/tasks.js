// backend/routes/tasks.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const Task = require('../models/Task');
const Equipment = require('../models/Equipment');

// GET /api/tasks
// Techs: only their tasks. Engineers/Admins: all (or ?my=1 for own).
// Optional ?equipmentId=
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { equipmentId, my } = req.query;

    const filter = {};
    if (equipmentId) filter.equipment = equipmentId;

    if (req.user.role === 'Technician' || my === '1') {
      filter.assignedTo = req.user._id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('equipment', 'name serialNumber status')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  })
);

// POST /api/tasks  (assign)
router.post(
  '/',
  protect,
  authorize('Engineer', 'Admin'),
  asyncHandler(async (req, res) => {
    const {
      title,
      description,
      taskType,
      pmType,
      pmInterval,
      priority = 'Low',
      assignedTo,
      equipment,
      dueDate
    } = req.body;

    if (!title || !taskType || !equipment || !dueDate) {
      return res.status(400).json({ message: 'Title, Task Type, Equipment and Due Date are required.' });
    }

    if (taskType === 'Preventive' && (!pmType || !pmInterval)) {
      return res.status(400).json({ message: 'PM Type and Periodic Interval are required for Preventive tasks.' });
    }

    const payload = {
      title,
      description,
      taskType,
      priority,
      assignedBy: req.user._id,
      equipment,
      dueDate,
      createdBy: req.user._id
    };
    if (assignedTo) payload.assignedTo = assignedTo;
    if (taskType === 'Preventive') {
      payload.pmType = pmType;
      payload.pmInterval = pmInterval;
      payload.isPreventive = true;
    }

    // When assigning, set initial equipment status business rule
    // (Install => keep Serviceable; others => Under Maintenance)
    const created = await Task.create(payload);

    // Apply initial equipment flag on assign
    try {
      const eq = await Equipment.findById(equipment);
      if (eq) {
        if (taskType === 'Install') {
          // keep as is or ensure Serviceable
          if (eq.status !== 'Serviceable') {
            eq.status = 'Serviceable';
            await eq.save();
          }
        } else {
          if (eq.status !== 'Under Maintenance') {
            eq.status = 'Under Maintenance';
            await eq.save();
          }
        }
      }
    } catch (_) {}

    // Socket broadcast
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('tasks:created', created._id);
        io.emit('equipment:updated', equipment);
      }
    } catch (_) {}

    res.status(201).json({ success: true, task: created });
  })
);

// PUT /api/tasks/:id/status
// Tech can update own task -> marks awaitingCertification=true
// Engineer/Admin can also change; still requires certification to affect inventory.
router.put(
  '/:id/status',
  protect,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Tech can only update own tasks
    if (req.user.role === 'Technician' && String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Update task status; DO NOT touch equipment here.
    task.status = status;
    task.awaitingCertification = true;
    task.certified = false;
    if (status === 'Completed') {
      task.completedDate = new Date();
    } else if (status === 'Cancelled' || status === 'Pending' || status === 'In Progress') {
      task.completedDate = null;
    }
    await task.save();

    try {
      const io = req.app.get('io');
      if (io) io.emit('tasks:updated', task._id);
    } catch (_) {}

    // Return populated version
    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('equipment', 'name serialNumber status');

    res.json({ success: true, task: updated });
  })
);

// PUT /api/tasks/:id  (save work details: fault/repair/spares)
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role === 'Technician' && String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const { faultDescription, repairDetails, spareParts } = req.body;
    if (faultDescription !== undefined) task.faultDescription = faultDescription;
    if (repairDetails !== undefined) task.repairDetails = repairDetails;
    if (Array.isArray(spareParts)) task.spareParts = spareParts;

    await task.save();

    try {
      const io = req.app.get('io');
      if (io) io.emit('tasks:updated', task._id);
    } catch (_) {}

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('equipment', 'name serialNumber status');

    res.json({ success: true, task: updated });
  })
);

// PUT /api/tasks/:id/certify
// Engineer/Admin confirms change and applies mapping to the inventory.
router.put(
  '/:id/certify',
  protect,
  authorize('Engineer', 'Admin'),
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).populate('equipment');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Apply equipment status mapping based on current task.status
    let nextEqStatus = task.equipment?.status;

    if (task.status === 'Pending' || task.status === 'In Progress') {
      nextEqStatus = 'Under Maintenance';
    } else if (task.status === 'Completed') {
      nextEqStatus = 'Serviceable';
    } else if (task.status === 'Cancelled') {
      nextEqStatus = 'Decommissioned';
    }

    // Persist equipment update
    if (task.equipment && nextEqStatus && task.equipment.status !== nextEqStatus) {
      task.equipment.status = nextEqStatus;
      await task.equipment.save();
    }

    // Mark certified
    task.certified = true;
    task.awaitingCertification = false;
    task.certifiedAt = new Date();
    task.certifiedBy = req.user._id;
    await task.save();

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('tasks:updated', task._id);
        if (task.equipment?._id) io.emit('equipment:updated', String(task.equipment._id));
      }
    } catch (_) {}

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('equipment', 'name serialNumber status');

    res.json({ success: true, task: updated });
  })
);

module.exports = router;
