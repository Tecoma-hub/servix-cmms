// backend/routes/maintenanceHistory.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createMaintenanceHistory,
  getMaintenanceHistory,
  getMaintenanceHistoryById
} = require('../controllers/maintenanceHistoryController');

const router = express.Router();

// Routes accessible to Engineers, Admins, and Technicians (for their own tasks)
router
  .route('/')
  .post(protect, createMaintenanceHistory);

// Routes accessible to all authenticated users
router
  .route('/:equipmentId')
  .get(protect, getMaintenanceHistory);

// Route accessible to all authenticated users
router
  .route('/record/:id')
  .get(protect, getMaintenanceHistoryById);

module.exports = router;