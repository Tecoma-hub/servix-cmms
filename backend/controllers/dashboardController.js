// backend/controllers/dashboardController.js
const Equipment = require('../models/Equipment');
const Task = require('../models/Task');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = asyncHandler(async (req, res, next) => {
  // Fetch equipment stats
  const totalEquipment = await Equipment.countDocuments();
  const serviceableCount = await Equipment.countDocuments({ status: 'Serviceable' });
  const maintenanceCount = await Equipment.countDocuments({ status: 'Under Maintenance' });
  const unserviceableCount = await Equipment.countDocuments({ status: 'Unserviceable' });

  // Fetch task stats
  const totalTasks = await Task.countDocuments();
  const pendingTasks = await Task.countDocuments({ status: 'Pending' });
  const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
  const completedTasks = await Task.countDocuments({ status: 'Completed' });

  // Fetch user stats
  const totalUsers = await User.countDocuments();

  res.status(200).json({
    success: true,
    dashboard: {
      equipment: {
        total: totalEquipment,
        serviceable: serviceableCount,
        maintenance: maintenanceCount,
        unserviceable: unserviceableCount
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks
      },
      users: {
        total: totalUsers
      }
    }
  });
});