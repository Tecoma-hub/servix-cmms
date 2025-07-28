// backend/controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  // Add debug logging
  console.log('Fetching tasks for user:', req.user);
  
  // Check if user exists in request
  if (!req.user) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  try {
    // Find tasks and populate related data
    const tasks = await Task.find()
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('equipment', 'name serialNumber brand model');
    
    console.log(`Found ${tasks.length} tasks`);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return next(new ErrorResponse('Failed to fetch tasks', 500));
  }
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = asyncHandler(async (req, res, next) => {
  console.log('Fetching task by ID:', req.params.id);
  
  if (!req.user) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('equipment', 'name serialNumber brand model');
    
    if (!task) {
      return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
    }
    
    res.status(200).json({
      success: true,
      task: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return next(new ErrorResponse('Failed to fetch task', 500));
  }
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  console.log('Creating new task with data:', req.body);
  console.log('User creating task:', req.user);
  
  if (!req.user) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  const { title, description, assignedTo, type, deadline, equipment } = req.body;
  
  // Validate required fields
  if (!title || !description || !assignedTo || !type || !deadline || !equipment) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  try {
    // Verify assignedTo user exists
    const user = await User.findById(assignedTo);
    if (!user) {
      return next(new ErrorResponse('Assigned user not found', 404));
    }

    // Verify equipment exists
    const equipmentDoc = await Equipment.findById(equipment);
    if (!equipmentDoc) {
      return next(new ErrorResponse('Equipment not found', 404));
    }

    // Create task with assignedBy set to current user
    const task = await Task.create({
      ...req.body,
      assignedBy: req.user._id
    });
    
    console.log('Task created successfully:', task._id);
    
    res.status(201).json({
      success: true,
      task: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return next(new ErrorResponse('Failed to create task', 500));
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  console.log('Updating task with ID:', req.params.id);
  console.log('Update data:', req.body);
  
  if (!req.user) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
    }

    // Verify assignedTo user exists if it's being updated
    if (req.body.assignedTo) {
      const user = await User.findById(req.body.assignedTo);
      if (!user) {
        return next(new ErrorResponse('Assigned user not found', 404));
      }
    }

    // Verify equipment exists if it's being updated
    if (req.body.equipment) {
      const equipmentDoc = await Equipment.findById(req.body.equipment);
      if (!equipmentDoc) {
        return next(new ErrorResponse('Equipment not found', 404));
      }
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    console.log('Task updated successfully:', task._id);
    
    res.status(200).json({
      success: true,
      task: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return next(new ErrorResponse('Failed to update task', 500));
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  console.log('Deleting task with ID:', req.params.id);
  
  if (!req.user) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
    }
    
    console.log('Task deleted successfully:', req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return next(new ErrorResponse('Failed to delete task', 500));
  }
});