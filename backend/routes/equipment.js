// backend/routes/equipment.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getEquipment,
  getEquipmentByDepartment,
  createEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');

const router = express.Router();

// Define routes
router.route('/')
  .get(protect, getEquipment)
  .post(protect, authorize('Engineer'), createEquipment);

// Route to get equipment by department
router.route('/department/:department')
  .get(protect, getEquipmentByDepartment);

router.route('/:id')
  .get(protect, getEquipmentById)
  .put(protect, authorize('Engineer'), updateEquipment)
  .delete(protect, authorize('Engineer'), deleteEquipment);

module.exports = router;