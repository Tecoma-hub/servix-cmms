// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Enable CORS with credentials
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
console.log('=== ROUTE DEBUGGING ===');
try {
  const authRoutes = require('./routes/auth');
  const equipmentRoutes = require('./routes/equipment');
  const taskRoutes = require('./routes/tasks');
  const maintenanceRoutes = require('./routes/maintenance');
  const userRoutes = require('./routes/users');

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/users', userRoutes);
  
  console.log('All routes imported and mounted successfully');
} catch (error) {
  console.error('Error importing routes:', error);
}

// Simple route logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servix_cmms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`\nServer running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Print API endpoints
      console.log('\n=== API ENDPOINTS ===');
      console.log('POST /api/auth/register - User registration');
      console.log('POST /api/auth/login - User login');
      console.log('GET /api/auth/me - Get current user');
      console.log('GET /api/equipment - Get all equipment');
      console.log('GET /api/tasks - Get all tasks');
      console.log('=========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;