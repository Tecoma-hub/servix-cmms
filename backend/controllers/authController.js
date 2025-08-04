// backend/controllers/authController.js
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const jwt = require('jsonwebtoken');
const { requestOTP, verifyOTP } = require('../utils/otpService');
const preApprovedStaff = require('../config/preApprovedStaff');

// @desc    Request OTP for login
// @route   POST /api/auth/request-otp
// @access  Public
exports.requestOTP = asyncHandler(async (req, res, next) => {
  const { serviceNumber } = req.body;

  // Validate required field
  if (!serviceNumber) {
    return next(new ErrorResponse('Please provide service number', 400));
  }

  try {
    // Find the staff member in the pre-approved list
    const staffMember = preApprovedStaff.find(member => member.serviceNumber === serviceNumber);
    if (!staffMember) {
      return next(new ErrorResponse('Service number not recognized', 400));
    }

    // Check if user exists, if not create one
    let user = await User.findOne({ serviceNumber });
    if (!user) {
      // Generate email based on name
      const email = `${staffMember.name.toLowerCase().replace(/\s+/g, '.')}.hospital@medtrackcmms.com`;
      
      // Create user with auto-filled information
      user = await User.create({
        serviceNumber,
        name: staffMember.name,
        email,
        phoneNumber: staffMember.phoneNumber,
        role: staffMember.role,
        department: 'TSEU'
      });
    }

    // Request OTP
    await requestOTP(serviceNumber);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone number'
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { serviceNumber, otp } = req.body;

  // Validate required fields
  if (!serviceNumber || !otp) {
    return next(new ErrorResponse('Please provide service number and OTP', 400));
  }

  try {
    // Verify OTP
    const user = await verifyOTP(serviceNumber, otp);
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        serviceNumber: user.serviceNumber,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user
  });
});