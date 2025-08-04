// backend/services/otpService.js
const crypto = require('crypto');
const preApprovedStaff = require('../config/preApprovedStaff');

// Generate a random 6-digit OTP
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit number
};

// Send OTP to phone number (development mode - logs to console)
exports.sendOTP = async (serviceNumber, otp) => {
  // Find the staff member by service number
  const staff = preApprovedStaff.find(s => s.serviceNumber === serviceNumber);
  
  if (!staff) {
    throw new Error('Staff member not found');
  }

  // Format phone number
  const phoneNumber = staff.phoneNumber.startsWith('+') ? staff.phoneNumber : `+233${staff.phoneNumber.slice(-9)}`;
  
  // Log OTP to console for development
  console.log(`=== DEVELOPMENT MODE ===`);
  console.log(`OTP for ${staff.name} (${staff.serviceNumber}): ${otp}`);
  console.log(`Phone: ${phoneNumber}`);
  console.log(`Role: ${staff.role}`);
  console.log(`========================`);
  
  return { success: true, message: 'OTP sent to console' };
};