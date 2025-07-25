const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getEquipment,
  getSingleEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getEquipment)
  .post(authorize('Engineer'), createEquipment);

router
  .route('/:id')
  .get(getSingleEquipment)
  .put(authorize('Engineer'), updateEquipment)
  .delete(authorize('Engineer'), deleteEquipment);

module.exports = router;