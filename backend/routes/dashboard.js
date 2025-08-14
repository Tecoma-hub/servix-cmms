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
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    try {
      // ---------- Equipment metrics ----------
      // Count by status (includes all, even if some statuses don't exist yet)
      const equipmentCountsAgg = await Equipment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } }
      ]);

      const totalEquipment = await Equipment.countDocuments();

      // Normalize into consistent keys
      const equipmentStats = {
        total: totalEquipment || 0,
        serviceable: 0,
        maintenance: 0,           // "Under Maintenance"
        unserviceable: 0,
        decommissioned: 0,
        auctioned: 0
      };

      for (const item of equipmentCountsAgg) {
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
          case 'Decommissioned':
            equipmentStats.decommissioned = item.count;
            break;
          case 'Auctioned':
            equipmentStats.auctioned = item.count;
            break;
          default:
            break;
        }
      }

      // ---------- Task metrics ----------
      const taskCountsAgg = await Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const taskStats = taskCountsAgg.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {}
      );

      const totalTasks = await Task.countDocuments();
      const overdue = await Task.countDocuments({
        status: { $nin: ['Completed', 'Cancelled'] },
        dueDate: { $lt: new Date() }
      });

      // ---------- Recent tasks (role-aware) ----------
      const taskQuery = {};
      if (req.user.role === 'Technician') {
        taskQuery.assignedTo = req.user._id;
      }

      const recentTasks = await Task.find(taskQuery)
        .populate('equipment', 'name serialNumber')
        .populate('assignedTo', 'name')
        .sort({ updatedAt: -1 }) // use updatedAt so it feels live
        .limit(10);

      // ---------- Warranty expiring soon ----------
      const warrantyExpiryDate = new Date();
      warrantyExpiryDate.setMonth(warrantyExpiryDate.getMonth() + 3);

      const warrantyExpiryEquipment = await Equipment.find({
        warrantyExpiry: { $lte: warrantyExpiryDate, $gte: new Date(0) } // allow past nulls out
      })
        .select('name serialNumber warrantyExpiry status')
        .sort({ warrantyExpiry: 1 })
        .limit(10);

      res.json({
        dashboard: {
          equipment: {
            total: equipmentStats.total,
            serviceable: equipmentStats.serviceable,
            maintenance: equipmentStats.maintenance,           // Under Maintenance
            unserviceable: equipmentStats.unserviceable,
            decommissioned: equipmentStats.decommissioned,
            auctioned: equipmentStats.auctioned
          },
          tasks: {
            total: totalTasks || 0,
            pending: taskStats.Pending || 0,
            inProgress: taskStats['In Progress'] || 0,
            completed: taskStats.Completed || 0,
            cancelled: taskStats.Cancelled || 0,
            overdue
          },
          recentTasks,
          warrantyExpiryEquipment
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  })
);

module.exports = router;
