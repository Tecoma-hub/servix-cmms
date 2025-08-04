// backend/middleware/auth.js
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
    } catch (err) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to request object
    req.user = await User.findById(decoded.id).select('-password');

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    
    if (roles.length === 0) {
      return next();
    }
    
    // Role hierarchy: Engineer > Admin > Technician
    if (req.user.role === 'Engineer') {
      return next();
    }
    
    if (req.user.role === 'Admin') {
      if (roles.includes('Engineer')) {
        return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
      }
      return next();
    }
    
    if (req.user.role === 'Technician') {
      const technicianAllowedRoutes = [
        '/equipment', 
        '/add-equipment', 
        '/maintenance', 
        '/report-issue', 
        '/tasks', 
        '/add-task'
      ];
      
      if (technicianAllowedRoutes.some(route => req.path.includes(route))) {
        return next();
      }
    }
    
    return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
  };
};