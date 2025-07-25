const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getTasks,
  getSingleTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getTasks)
  .post(authorize('Engineer'), createTask);

router
  .route('/:id')
  .get(getSingleTask)
  .put(authorize('Engineer'), updateTask)
  .delete(authorize('Engineer'), deleteTask);

module.exports = router;