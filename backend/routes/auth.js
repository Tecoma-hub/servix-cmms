// backend/routes/auth.js
const express = require('express');
const { requestOTP, verifyOTP, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// OTP-based authentication routes
router.route('/request-otp').post(requestOTP);
router.route('/verify-otp').post(verifyOTP);
router.route('/me').get(protect, getMe);

module.exports = router;