// backend/routes/dashboard.js
const express = require('express');
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Use protect middleware for all routes
router.use(protect);

router.get('/', dashboardController.getDashboardData);

module.exports = router;