// backend/routes/tasks.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

// Define routes
router.route('/')
  .get(protect, getTasks)
  .post(protect, authorize('Engineer'), createTask);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, authorize('Engineer'), updateTask)
  .delete(protect, authorize('Engineer'), deleteTask);

module.exports = router;