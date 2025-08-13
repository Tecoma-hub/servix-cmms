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
  return true;
};

// Normalize service number for consistent matching
const normalizeServiceNumber = (sn) => sn.trim().toUpperCase();

// Request OTP for a user (works for both login and registration)
const requestOTP = async (serviceNumber) => {
  const normalizedSN = normalizeServiceNumber(serviceNumber);

  // Find user
  const user = await User.findOne({ serviceNumber: normalizedSN });
  if (!user) {
    throw new Error('User not found when requesting OTP');
  }

  if (!user.phoneNumber) {
    throw new Error('User has no phone number configured');
  }

  // Generate OTP
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  // Save OTP immediately to DB
  user.otp = { code: otpCode, expiresAt };
  await user.save({ validateBeforeSave: false });

  // Send OTP
  await sendOTP(user.phoneNumber, otpCode);

  return { success: true, message: 'OTP sent successfully' };
};

// Verify OTP for both new and existing users
const verifyOTP = async (serviceNumber, otp) => {
  const normalizedSN = normalizeServiceNumber(serviceNumber);

  const user = await User.findOne({ serviceNumber: normalizedSN });
  if (!user) {
    throw new Error('User not found when verifying OTP');
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

  // OTP is valid — clear and save
  user.otp = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

module.exports = {
  requestOTP,
  verifyOTP
};
