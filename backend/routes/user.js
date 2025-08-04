// backend/routes/user.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Get all users (Admin and Engineer only)
router.route('/')
  .get(protect, authorize('Admin', 'Engineer'), userController.getAllUsers);

module.exports = router;