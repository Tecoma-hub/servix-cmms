// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');                 // ✅ new
const { Server } = require('socket.io');      // ✅ new

// Load env vars
dotenv.config({ path: './.env' });

if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Route files
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log('MongoDB Connection Error:', err));

const app = express();

// CORS setup
const FRONTEND_ORIGIN = 'http://localhost:3000';
app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Body parser
app.use(express.json());

// ✅ Create HTTP server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Expose io to routes via app locals
app.set('io', io);

// Socket basic wiring
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  // Optional: join a user room if client sends their userId
  socket.on('user:join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      // console.log(`Socket ${socket.id} joined user:${userId}`);
    }
  });
  socket.on('disconnect', () => {
    // console.log('Socket disconnected:', socket.id);
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// Simple route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servix CMMS API is running'
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Improved error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
