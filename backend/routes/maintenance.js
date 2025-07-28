// backend/routes/maintenance.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getMaintenance,
  getMaintenanceById,
  schedulePreventive,
  reportIssue,
  updateMaintenance,
  deleteMaintenance
} = require('../controllers/maintenanceController');

const router = express.Router();

// Define routes
router.route('/')
  .get(protect, getMaintenance)
  .post(protect, authorize('Engineer', 'Manager'), schedulePreventive);

router.route('/:id')
  .get(protect, getMaintenanceById)
  .put(protect, authorize('Engineer', 'Manager'), updateMaintenance)
  .delete(protect, authorize('Engineer', 'Manager'), deleteMaintenance);

// Special route for scheduling preventive maintenance
router.post('/schedule', protect, authorize('Engineer', 'Manager'), schedulePreventive);

// Special route for reporting issues
router.post('/report', protect, authorize('Engineer', 'Manager'), reportIssue);

module.exports = router;