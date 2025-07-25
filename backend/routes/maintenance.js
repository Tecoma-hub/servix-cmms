const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getMaintenance,
  getSingleMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance
} = require('../controllers/maintenanceController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getMaintenance)
  .post(authorize('Engineer'), createMaintenance);

router
  .route('/:id')
  .get(getSingleMaintenance)
  .put(authorize('Engineer'), updateMaintenance)
  .delete(authorize('Engineer'), deleteMaintenance);

module.exports = router;