// backend/routes/tasks.js

const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { sendSMS } = require('../utils/notify');  // ✅ new

// Create a New Task
router.post('/', protect, asyncHandler(async (req, res) => {
  const { title, description, taskType, priority, assignedTo, equipment, dueDate } = req.body;

  if (!['Admin', 'Engineer'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized to assign tasks' });
  }

  // Validate minimum required inputs
  if (!title) return res.status(400).json({ message: 'Title is required' });
  if (!taskType) return res.status(400).json({ message: 'taskType is required' });
  if (!equipment) return res.status(400).json({ message: 'equipment is required' });

  const validTaskTypes = ['Repair', 'Install', 'Inspect', 'Assess', 'Calibrate'];
  if (!validTaskTypes.includes(taskType)) {
    return res.status(400).json({ message: `Invalid taskType. Allowed: ${validTaskTypes.join(', ')}` });
  }

  const equipmentExists = await Equipment.findById(equipment);
  if (!equipmentExists) {
    return res.status(404).json({ message: 'Equipment not found' });
  }

  // assignedTo is optional
  let assignedToId = null;
  let assignee = null;
  if (assignedTo) {
    assignee = await User.findById(assignedTo);
    if (!assignee || assignee.role !== 'Technician') {
      return res.status(404).json({ message: 'Technician not found' });
    }
    assignedToId = assignee._id;
  }

  const task = await Task.create({
    title,
    description,
    taskType,
    priority,
    assignedTo: assignedToId,
    assignedBy: req.user._id,
    equipment,
    dueDate,
    createdBy: req.user._id
  });

  // Populate for nicer payloads
  const fullTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email role phone')
    .populate('assignedBy', 'name role')
    .populate('equipment', 'name serialNumber status');

  // ✅ Socket emit: notify the assignee in real-time
  const io = req.app.get('io');
  if (assignedToId && io) {
    io.to(`user:${assignedToId.toString()}`).emit('task:assigned', { task: fullTask });
  }

  // ✅ SMS notify (if phone present)
  if (assignee?.phone) {
    const body = `New task assigned: ${fullTask.title} (${fullTask.taskType}). Priority: ${fullTask.priority}.`;
    sendSMS(assignee.phone, body).catch(() => {});
  }

  res.status(201).json({ success: true, task: fullTask });
}));

// Get All Tasks
router.get('/', protect, asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === 'Technician') {
    query.assignedTo = req.user._id;
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name role')
    .populate('equipment', 'name serialNumber status')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: tasks.length, tasks });
}));

// Get Task by ID
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name role')
    .populate('equipment', 'name serialNumber status department location');

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const assignedToId = task.assignedTo ? task.assignedTo._id?.toString() : null;
  if (req.user.role === 'Technician' && assignedToId !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view this task' });
  }

  res.status(200).json({ success: true, task });
}));

// Update Task (Technicians Only)
router.put('/:id', protect, asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this task' });
  }

  if (['Completed', 'Cancelled'].includes(task.status)) {
    return res.status(400).json({ message: 'Cannot update completed or cancelled tasks' });
  }

  const { faultDescription, comments, spareParts, status } = req.body;
  if (faultDescription !== undefined) task.faultDescription = faultDescription;
  if (comments !== undefined) task.comments = comments;
  if (spareParts !== undefined) task.spareParts = spareParts;
  if (status) {
    task.status = status;
    if (status === 'Completed') task.completedDate = Date.now();
  }

  const updatedTask = await task.save();

  // Notify assignee (self) via socket
  const io = req.app.get('io');
  if (io && updatedTask.assignedTo) {
    io.to(`user:${updatedTask.assignedTo.toString()}`).emit('task:updated', {
      taskId: updatedTask._id.toString(),
      status: updatedTask.status
    });
  }

  res.status(200).json({ success: true, task: updatedTask });
}));

// Update Task Status (PUT /api/tasks/:id/status)
router.put('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const userIdStr = req.user._id.toString();
  const assignedToStr = task.assignedTo ? task.assignedTo.toString() : null;

  if (req.user.role === 'Technician') {
    if (!assignedToStr || assignedToStr !== userIdStr) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
  }

  if (['Completed', 'Cancelled'].includes(task.status)) {
    return res.status(400).json({ message: 'Cannot update completed or cancelled tasks' });
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    { $set: { status, completedDate: status === 'Completed' ? Date.now() : null } },
    { new: true, runValidators: false }
  )
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name role')
    .populate('equipment', 'name serialNumber status');

  // Socket notify assignee
  const io = req.app.get('io');
  if (io && updatedTask?.assignedTo?._id) {
    io.to(`user:${updatedTask.assignedTo._id.toString()}`).emit('task:updated', {
      taskId: updatedTask._id.toString(),
      status: updatedTask.status
    });
  }

  res.status(200).json({ success: true, task: updatedTask });
}));

// Delete Task (Admin/Engineer)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  if (!['Admin', 'Engineer'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized to delete tasks' });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  await task.remove();
  res.status(200).json({ success: true, message: 'Task deleted' });
}));

module.exports = router;
