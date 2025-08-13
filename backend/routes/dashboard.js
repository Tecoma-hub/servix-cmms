// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const Task = require('../models/Task');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  try {
    // Get equipment counts by status
    const equipmentCounts = await Equipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      }
    ]);

    // Calculate total equipment
    const totalEquipment = await Equipment.countDocuments();

    const equipmentStats = {
      total: totalEquipment,
      serviceable: 0,
      maintenance: 0,
      unserviceable: 0
    };

    // Populate specific status counts
    equipmentCounts.forEach(item => {
      switch (item.status) {
        case 'Serviceable':
          equipmentStats.serviceable = item.count;
          break;
        case 'Under Maintenance':
          equipmentStats.maintenance = item.count;
          break;
        case 'Unserviceable':
          equipmentStats.unserviceable = item.count;
          break;
      }
    });

    // Get task counts by status
    const taskCounts = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const taskStats = taskCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Get recent tasks
    const recentTasks = await Task.find({})
      .populate('equipment', 'name serialNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get equipment nearing warranty expiry
    const warrantyExpiryDate = new Date();
    warrantyExpiryDate.setMonth(warrantyExpiryDate.getMonth() + 3);
    
    const warrantyExpiryEquipment = await Equipment.find({
      warrantyExpiry: { $lte: warrantyExpiryDate, $gte: new Date() }
    }).limit(5);

    res.json({
      dashboard: {
        equipment: {
          total: equipmentStats.total || 0,
          serviceable: equipmentStats.serviceable || 0,
          maintenance: equipmentStats.maintenance || 0,
          unserviceable: equipmentStats.unserviceable || 0
        },
        tasks: {
          total: taskStats.Total || 0,
          pending: taskStats.Pending || 0,
          inProgress: taskStats['In Progress'] || 0,
          completed: taskStats.Completed || 0
        },
        recentTasks,
        warrantyExpiryEquipment
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
}));

module.exports = router;