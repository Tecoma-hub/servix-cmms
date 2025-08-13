const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Protect routes - check token & user
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(401);
      throw new Error('Not authorized to access this route');
    }
  } else {
    res.status(401);
    throw new Error('No token, authorization denied');
  }
});

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (userRole === 'Engineer' || userRole === 'Admin') {
      // Engineers and Admins can access everything
      return next();
    }

    if (roles.includes(userRole)) {
      // Allow access if userRole is in allowed list
      return next();
    }

    return res.status(403).json({
      message: `${userRole} is not authorized to access this route`
    });
  };
};

// Special technician-only check for updating their own assigned task status
exports.technicianCanUpdateOwnTask = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (user.role === 'Engineer' || user.role === 'Admin') {
    return next(); // Allow full access
  }

  if (user.role !== 'Technician') {
    return res.status(403).json({ message: 'Only technicians can perform this action' });
  }

  const taskId = req.params.id || req.body.taskId;

  if (!taskId) {
    return res.status(400).json({ message: 'Task ID is required' });
  }

  const Task = require('../models/Task');
  const task = await Task.findById(taskId);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (task.assignedTo.toString() !== user._id.toString()) {
    return res.status(403).json({ message: 'You can only update your own assigned tasks' });
  }

  next();
});
