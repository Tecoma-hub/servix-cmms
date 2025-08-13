// backend/routes/staff.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Get all preapproved technicians
// @route   GET /api/staff/preapproved
// @access  Private
router.get('/preapproved', protect, asyncHandler(async (req, res) => {
  try {
    const technicians = await User.find({ 
      role: 'Technician', 
      preApproved: true 
    }).select('name serviceNumber department');
    res.json({ technicians });
  } catch (error) {
    console.error('Error fetching preapproved staff:', error);
    res.status(500).json({ message: 'Server error' });
  }
}));

module.exports = router;
