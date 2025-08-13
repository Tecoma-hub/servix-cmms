// backend/routes/equipment.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const Equipment = require('../models/Equipment');

// @desc    Get all equipment (supports live search + optional filters)
// @route   GET /api/equipment
// @access  Private
// Query (all optional):
//   search       -> text across name/model/serial/manufacturer/department/location/category/status
//   department   -> exact department match
//   status       -> exact status match
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { search = '', department = '', status = '' } = req.query;

      const query = {};

      // Text search across common fields
      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
          { name: regex },
          { model: regex },
          { serialNumber: regex },
          { manufacturer: regex },
          { department: regex },
          { location: regex },
          { category: regex },
          { status: regex }
        ];
      }

      if (department) query.department = department;
      if (status) query.status = status;

      // IMPORTANT: select ALL fields your UI needs
      const equipment = await Equipment.find(query)
        .select(
          '_id name model serialNumber manufacturer department location category status installationDate warrantyExpiry createdAt updatedAt'
        )
        .sort({ name: 1 });

      res.json({ success: true, equipment });
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  })
);

// @desc    Get equipment by ID
// @route   GET /api/equipment/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
}));

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private (Admin/Engineer)
router.post('/', protect, authorize('Admin', 'Engineer'), asyncHandler(async (req, res) => {
  const { 
    name, 
    status, 
    manufacturer, 
    model, 
    serialNumber, 
    department, 
    location, 
    installationDate, 
    warrantyExpiry, 
    category 
  } = req.body;

  if (!name || !status || !manufacturer || !model || !serialNumber || !department || !location || !installationDate || !category) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  const existingEquipment = await Equipment.findOne({ serialNumber });
  if (existingEquipment) {
    return res.status(400).json({ 
      message: `Equipment with serial number ${serialNumber} already exists` 
    });
  }

  const equipment = await Equipment.create({
    name,
    status,
    manufacturer,
    model,
    serialNumber,
    department,
    location,
    installationDate,
    warrantyExpiry,
    category,
    createdBy: req.user._id
  });

  res.status(201).json(equipment);
}));

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private (Admin/Engineer)
router.put('/:id', protect, authorize('Admin', 'Engineer'), asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) {
    return res.status(404).json({ message: 'Equipment not found' });
  }
  Object.assign(equipment, req.body);
  await equipment.save();
  res.json(equipment);
}));

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Admin/Engineer)
router.delete('/:id', protect, authorize('Admin', 'Engineer'), asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) {
    return res.status(404).json({ message: 'Equipment not found' });
  }
  await equipment.remove();
  res.json({ message: 'Equipment removed' });
}));

module.exports = router;
