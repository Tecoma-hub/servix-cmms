// backend/routes/users.js
const express = require('express');
const asyncHandler = require('express-async-handler');
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

/* -----------------------------------------------------------
 * Helpers
 * --------------------------------------------------------- */
const isEngineer = (u) => ['Engineer', 'Admin'].includes(u?.role);

function buildSelfUpdate(body = {}) {
  // Only allow these top-level fields on /me
  const top = ['name', 'email', 'phoneNumber', 'department', 'avatar'];
  const out = {};

  top.forEach((k) => {
    if (body[k] !== undefined) out[k] = body[k];
  });

  if (body.notifications && typeof body.notifications === 'object') {
    out['notifications.taskUpdates']      = body.notifications.taskUpdates;
    out['notifications.inventoryChanges'] = body.notifications.inventoryChanges;
    out['notifications.weeklyDigest']     = body.notifications.weeklyDigest;
  }

  if (body.preferences && typeof body.preferences === 'object') {
    out['preferences.itemsPerPage'] = body.preferences.itemsPerPage;
  }

  if (body.appearance && typeof body.appearance === 'object') {
    out['appearance.darkMode'] = body.appearance.darkMode;
  }

  return out;
}

/* -----------------------------------------------------------
 * Specific routes BEFORE any dynamic '/:id'
 * --------------------------------------------------------- */

/**
 * GET /api/users/preapproved/technicians
 * Query:
 *   approved=true|false|any (default: true)
 *   q=<name contains>
 */
router.get(
  '/preapproved/technicians',
  protect,
  authorize('Engineer', 'Admin'),
  asyncHandler(async (req, res) => {
    const { approved = 'true', q } = req.query;

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
      // any missing flags should also count as not approved
      { preApproved: { $exists: false }, isApproved: { $exists: false }, approved: { $exists: false } }
    ];

    if (approved === 'true') approvalFilter = { $or: approvedOr };
    else if (approved === 'false') approvalFilter = { $or: notApprovedOr };

    const nameFilter = q ? { name: { $regex: String(q), $options: 'i' } } : {};

    const technicians = await User.find({
      role: 'Technician',
      ...approvalFilter,
      ...nameFilter
    })
      .select('_id name email phoneNumber serviceNumber department role')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: technicians.length,
      technicians
    });
  })
);

/**
 * GET /api/users/me
 * Return currently authenticated user
 */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  })
);

/**
 * PUT /api/users/me
 * Update own profile + settings (no role changes here)
 */
router.put(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    // Block role changes via /me unless explicitly Engineer/Admin (and we still ignore it here)
    if ('role' in req.body && !isEngineer(req.user)) {
      return res.status(403).json({ message: 'Not allowed to change role' });
    }

    const update = buildSelfUpdate(req.body);

    try {
      const user = await User.findByIdAndUpdate(req.user._id, update, {
        new: true,
        runValidators: true
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ success: true, user });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(400).json({ message: 'Email or service number already in use' });
      }
      throw err;
    }
  })
);

/* -----------------------------------------------------------
 * Existing routes (Engineer/Admin only)
 * --------------------------------------------------------- */

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
