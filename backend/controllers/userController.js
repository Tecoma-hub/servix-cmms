// backend/controllers/userController.js
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  
  res.status(200).json({
    success: true,
    count: users.length,
    users: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    user: user
  });
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department, phone } = req.body;
  
  // Validate required fields
  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email, and password', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already exists', 400));
  }

  // Create user
  const user = await User.create(req.body);
  
  res.status(201).json({
    success: true,
    user: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    user: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});