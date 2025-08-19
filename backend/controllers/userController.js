// backend/controllers/userController.js
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/* ------------------------------ helpers ------------------------------ */
const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? ((acc[k] = obj[k]), acc) : acc), {});

function normalizeBody(body = {}) {
  const allowed = [
    'serviceNumber',
    'name',
    'email',
    'phoneNumber',
    'role',
    'department',
    'avatar',
    'isActive',
    'preApproved',
  ];
  const data = pick(body, allowed);

  if (data.email) data.email = String(data.email).toLowerCase();
  if (data.role && !['Technician', 'Engineer', 'Admin'].includes(data.role)) {
    delete data.role;
  }
  if (data.isActive !== undefined) data.isActive = !!data.isActive;
  if (data.preApproved !== undefined) data.preApproved = !!data.preApproved;

  return data;
}

/* ------------------------------- CRUD ------------------------------- */
// @desc    Get all users (search + filter + pagination)
// @route   GET /api/users
// @access  Private (Admin, Engineer)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    q,
    role,
    department,
    active,           // 'true' | 'false' | undefined
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (q) {
    const s = String(q);
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { serviceNumber: { $regex: s, $options: 'i' } },
      { phoneNumber: { $regex: s, $options: 'i' } },
    ];
  }
  if (role && ['Technician', 'Engineer', 'Admin'].includes(role)) filter.role = role;
  if (department) filter.department = department;
  if (active === 'true') filter.isActive = true;
  if (active === 'false') filter.isActive = false;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ name: 1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .select('-password'),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / pageSize),
    users,
  });
});

// @desc    Create a user
// @route   POST /api/users
// @access  Private (Admin, Engineer)
exports.createUser = asyncHandler(async (req, res, next) => {
  const data = normalizeBody(req.body);

  if (!data.name || !data.email || !data.serviceNumber || !data.phoneNumber) {
    return next(new ErrorResponse('name, email, serviceNumber and phoneNumber are required', 400));
  }

  try {
    const user = await User.create(data);
    return res.status(201).json({ success: true, user });
  } catch (err) {
    // Handle unique keys (email, serviceNumber)
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return next(new ErrorResponse(`Duplicate ${field}. It must be unique.`, 400));
    }
    throw err;
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin, Engineer)
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.status(200).json({ success: true, user });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin, Engineer)
exports.updateUser = asyncHandler(async (req, res, next) => {
  const data = normalizeBody(req.body);
  try {
    const user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return next(new ErrorResponse('User not found', 404));
    res.status(200).json({ success: true, user });
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return next(new ErrorResponse(`Duplicate ${field}. It must be unique.`, 400));
    }
    throw err;
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin, Engineer)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted' });
});

/* ----------------------------- Profile (me) ---------------------------- */
// @desc    Get my profile
// @route   GET /api/users/me
// @access  Private (any logged-in)
exports.getMe = asyncHandler(async (req, res) => {
  const me = await User.findById(req.user.id).select('-password');
  res.status(200).json({ success: true, user: me });
});

// @desc    Update my profile (safe fields only)
// @route   PUT /api/users/me
// @access  Private (any logged-in)
exports.updateMe = asyncHandler(async (req, res, next) => {
  // Only allow user-safe fields here
  const data = pick(req.body, ['name', 'email', 'phoneNumber', 'department', 'avatar']);
  if (data.email) data.email = String(data.email).toLowerCase();

  try {
    const me = await User.findByIdAndUpdate(req.user.id, data, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!me) return next(new ErrorResponse('User not found', 404));
    res.status(200).json({ success: true, user: me });
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return next(new ErrorResponse(`Duplicate ${field}. It must be unique.`, 400));
    }
    throw err;
  }
});
