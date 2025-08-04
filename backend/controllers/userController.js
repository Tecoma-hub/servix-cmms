// backend/controllers/userController.js
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Engineer)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  // Exclude password from the response
  const users = await User.find().select('-password');
  
  res.status(200).json({
    success: true,
     users
  });
});