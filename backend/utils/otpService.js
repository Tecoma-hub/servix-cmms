// backend/utils/otpService.js
const crypto = require('crypto');
const User = require('../models/User');

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS (mock implementation)
const sendOTP = async (phoneNumber, otp) => {
  // In production, integrate with Twilio or other SMS service
  console.log(`OTP sent to ${phoneNumber}: ${otp}`);
  
  // For development, we'll just log the OTP
  return true;
};

// Request OTP for a user
const requestOTP = async (serviceNumber) => {
  const user = await User.findOne({ serviceNumber });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.phoneNumber) {
    throw new Error('User has no phone number configured');
  }
  
  // Generate OTP
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  
  // Save OTP to user
  user.otp = {
    code: otpCode,
    expiresAt: expiresAt
  };
  
  await user.save();
  
  // Send OTP via SMS
  await sendOTP(user.phoneNumber, otpCode);
  
  return { success: true, message: 'OTP sent successfully' };
};

// Verify OTP
const verifyOTP = async (serviceNumber, otp) => {
  const user = await User.findOne({ serviceNumber });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.otp || !user.otp.code) {
    throw new Error('No OTP found for this user');
  }
  
  if (user.otp.code !== otp) {
    throw new Error('Invalid OTP');
  }
  
  if (new Date() > user.otp.expiresAt) {
    throw new Error('OTP has expired');
  }
  
  // OTP is valid, clear it and return user
  user.otp = undefined;
  await user.save();
  
  return user;
};

module.exports = {
  requestOTP,
  verifyOTP
};