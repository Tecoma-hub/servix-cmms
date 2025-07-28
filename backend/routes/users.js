// backend/routes/users.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

// Define routes
router.route('/')
  .get(protect, authorize('Engineer', 'Manager', 'Admin'), getUsers)
  .post(protect, authorize('Engineer', 'Manager', 'Admin'), createUser);

router.route('/:id')
  .get(protect, authorize('Engineer', 'Manager', 'Admin'), getUserById)
  .put(protect, authorize('Engineer', 'Manager', 'Admin'), updateUser)
  .delete(protect, authorize('Engineer', 'Manager', 'Admin'), deleteUser);

module.exports = router;