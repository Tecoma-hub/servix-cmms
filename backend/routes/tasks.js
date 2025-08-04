// backend/routes/tasks.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

// Use protect middleware for all routes
router.use(protect);

// Engineer can do everything
// Admin can create and view tasks
// Technician can only view tasks
router.route('/')
  .get(authorize('Engineer', 'Admin', 'Technician'), getTasks)
  .post(authorize('Engineer', 'Admin'), createTask);

router.route('/:id')
  .get(authorize('Engineer', 'Admin', 'Technician'), getTask)
  .put(authorize('Engineer', 'Admin'), updateTask)
  .delete(authorize('Engineer', 'Admin'), deleteTask);

module.exports = router;