// backend/routes/equipment.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const Equipment = require('../models/Equipment');

/**
 * @desc    Get all equipment (supports live search + optional filters)
 * @route   GET /api/equipment
 * @access  Private
 * Query (optional):
 *   search       -> text across name/model/serial/manufacturer/department/location/category/status
 *   department   -> exact department match
 *   status       -> exact status match
 */
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { search = '', department = '', status = '' } = req.query;

      const query = {};

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
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
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
  })
);

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private (Admin/Engineer)
router.post(
  '/',
  protect,
  authorize('Admin', 'Engineer'),
  asyncHandler(async (req, res) => {
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

    if (
      !name ||
      !status ||
      !manufacturer ||
      !model ||
      !serialNumber ||
      !department ||
      !location ||
      !installationDate ||
      !category
    ) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const existingEquipment = await Equipment.findOne({ serialNumber });
    if (existingEquipment) {
      return res
        .status(400)
        .json({ message: `Equipment with serial number ${serialNumber} already exists` });
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

    // Emit snapshot to clients
    const io = req.app.get('io');
    if (io) {
      io.emit('equipment:updated', {
        equipment: await Equipment.findById(equipment._id).select(
          '_id name model serialNumber manufacturer department location category status installationDate warrantyExpiry'
        )
      });
    }

    res.status(201).json(equipment);
  })
);

// @desc    Update equipment (Engineer can set final statuses; Admin cannot set those two)
// @route   PUT /api/equipment/:id
// @access  Private (Admin/Engineer)
router.put(
  '/:id',
  protect,
  authorize('Admin', 'Engineer'),
  asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Enforce Engineer-only for final statuses
    const nextStatus = req.body?.status;
    if (nextStatus && ['Decommissioned', 'Auctioned'].includes(nextStatus)) {
      if (req.user.role !== 'Engineer') {
        return res
          .status(403)
          .json({ message: 'Only Engineer can set equipment to Decommissioned or Auctioned' });
      }
    }

    Object.assign(equipment, req.body);
    await equipment.save();

    // Emit latest snapshot
    const io = req.app.get('io');
    if (io) {
      const fullEq = await Equipment.findById(req.params.id).select(
        '_id name model serialNumber manufacturer department location category status installationDate warrantyExpiry'
      );
      io.emit('equipment:updated', { equipment: fullEq });
    }

    res.json(equipment);
  })
);

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Admin/Engineer)
router.delete(
  '/:id',
  protect,
  authorize('Admin', 'Engineer'),
  asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    await equipment.remove();

    // Emit deletion (optional; clients can refetch or handle if needed)
    const io = req.app.get('io');
    if (io) {
      io.emit('equipment:deleted', { id: req.params.id });
    }

    res.json({ message: 'Equipment removed' });
  })
);

module.exports = router;
