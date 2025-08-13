// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get all users (only Admin & Engineer)
// @route   GET /api/users
// @access  Private (Admin/Engineer only)
router.get('/', protect, async (req, res) => {
  try {
    // Restrict access
    if (!['Admin', 'Engineer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const users = await User.find().select('-otp'); // exclude OTP for security
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
