// backend/middleware/auth.js
const ErrorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check if token exists in cookies (if using cookies)
  else if (req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Check if token exists in query parameters
  else if (req.query.token) {
    token = req.query.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user to request object
    req.user = await User.findById(decoded.id);
    
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  }
};