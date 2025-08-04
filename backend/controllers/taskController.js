// backend/controllers/taskController.js
const Task = require('../models/Task');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  const tasks = await Task.find().populate('equipment').populate('assignedTo').populate('createdBy');
  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('equipment').populate('assignedTo').populate('createdBy');
  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }
  res.status(200).json({
    success: true,
    task
  });
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add createdBy field from authenticated user
  if (req.user && req.user.id) {
    req.body.createdBy = req.user.id;
  } else {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  try {
    const task = await Task.create(req.body);
    
    res.status(201).json({
      success: true,
      task
    });
  } catch (err) {
    return next(new ErrorResponse(`Failed to create task: ${err.message}`, 400));
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);
  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  // Ensure createdBy is not updated
  if (req.body.createdBy) {
    delete req.body.createdBy;
  }

  try {
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      task
    });
  } catch (err) {
    return next(new ErrorResponse(`Failed to update task: ${err.message}`, 400));
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  await task.remove();

  res.status(200).json({ success: true, message: 'Task deleted' });
});