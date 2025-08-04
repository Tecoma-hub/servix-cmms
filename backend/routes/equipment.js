// backend/routes/equipment.js
const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getAllEquipment,
  getEquipmentById,
  addEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');

const router = express.Router();

// Use protect middleware for all routes
router.use(protect);

router.route('/')
  .get(getAllEquipment)
  .post(addEquipment);

router.route('/:id')
  .get(getEquipmentById)
  .put(updateEquipment)
  .delete(deleteEquipment);

module.exports = router;