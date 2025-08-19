// backend/routes/settings.js
const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// 🔐 all endpoints require auth
router.use(protect);

// Helper: coerce boolean-like values
const b = (v) => (v === true || v === 'true' || v === 1 || v === '1');

// PUT /api/settings/profile
router.put('/profile', asyncHandler(async (req, res) => {
  const { name, email } = req.body || {};
  const updates = {};
  if (typeof name === 'string') updates.name = name.trim();
  if (typeof email === 'string') updates.email = email.trim().toLowerCase();

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, user });
}));

// PUT /api/settings/notifications
router.put('/notifications', asyncHandler(async (req, res) => {
  const n = req.body?.notifications || req.body || {};
  const updates = {
    'notifications.taskUpdates': b(n.taskUpdates),
    'notifications.inventoryChanges': b(n.inventoryChanges),
    'notifications.weeklyDigest': b(n.weeklyDigest),
  };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, user });
}));

// PUT /api/settings/preferences
router.put('/preferences', asyncHandler(async (req, res) => {
  const p = req.body?.preferences || req.body || {};
  const items = Number(p.itemsPerPage);
  const updates = {};
  if (!Number.isNaN(items) && items >= 5 && items <= 100) {
    updates['preferences.itemsPerPage'] = items;
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, user });
}));

// PUT /api/settings/appearance
router.put('/appearance', asyncHandler(async (req, res) => {
  const a = req.body?.appearance || req.body || {};
  const updates = { 'appearance.darkMode': b(a.darkMode) };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, user });
}));

module.exports = router;
