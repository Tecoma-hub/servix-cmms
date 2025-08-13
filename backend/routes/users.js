// backend/routes/users.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const User = require('../models/User');

const router = express.Router();

/**
 * IMPORTANT: specific routes BEFORE dynamic `/:id`
 */

// GET /api/users/preapproved/technicians
// Query:
//   approved=true|false|any   (default: true)
//     - true  -> only approved (preApproved/isApproved/approved/status Active)
//     - false -> only NOT approved
//     - any   -> no approval filter (ALL technicians)
router.get(
  '/preapproved/technicians',
  protect,
  authorize('Engineer', 'Admin'),
  async (req, res) => {
    try {
      const { approved = 'true', q } = req.query;

      // Build approval filter
      let approvalFilter = {};
      const approvedOr = [
        { preApproved: true },
        { isApproved: true },
        { approved: true },
        { status: { $in: ['Approved', 'Preapproved', 'Active'] } }
      ];
      const notApprovedOr = [
        { preApproved: false },
        { isApproved: false },
        { approved: false },
        { status: { $nin: ['Approved', 'Preapproved', 'Active'] } },
        { preApproved: { $exists: false }, isApproved: { $exists: false }, approved: { $exists: false } }
      ];

      if (approved === 'true') {
        approvalFilter = { $or: approvedOr };
      } else if (approved === 'false') {
        approvalFilter = { $or: notApprovedOr };
      } else {
        approvalFilter = {};
      }

      // Optional name search
      const nameFilter = q ? { name: { $regex: String(q), $options: 'i' } } : {};

      const technicians = await User.find({
        role: 'Technician',
        ...approvalFilter,
        ...nameFilter
      })
        .select('_id name email phone serviceNumber department role')
        .sort({ name: 1 });

      return res.status(200).json({
        success: true,
        count: technicians.length,
        technicians
      });
    } catch (error) {
      console.error('Error fetching technicians:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Existing routes
router
  .route('/')
  .get(protect, authorize('Engineer', 'Admin'), getAllUsers)
  .post(protect, authorize('Engineer', 'Admin'), createUser);

router
  .route('/:id')
  .get(protect, authorize('Engineer', 'Admin'), getUserById)
  .put(protect, authorize('Engineer', 'Admin'), updateUser)
  .delete(protect, authorize('Engineer', 'Admin'), deleteUser);

module.exports = router;
