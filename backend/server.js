// backend/server.js
require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

// Routes
const authRoutes = require('./routes/auth');           // if present
const userRoutes = require('./routes/users');
const equipmentRoutes = require('./routes/equipment');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');      // report generator endpoints
const settingsRoutes = require('./routes/settings');   // ✅ NEW: settings save endpoints

const app = express();
const server = http.createServer(app);

// --- Socket.IO ---
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  socket.emit('connected', { ok: true });
  socket.on('disconnect', () => {});
});

// --- DB Connect ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/servix_cmms';
mongoose.set('strictQuery', true);
mongoose
  .connect(MONGO_URI, { dbName: process.env.DB_NAME || undefined })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- Middleware ---
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// --- Static for generated reports ---
app.use('/downloads', express.static(path.join(process.cwd(), 'downloads')));

// --- API routes ---
if (authRoutes) app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes); // ✅ mount settings routes

// --- Health check ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- 404 handler ---
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

// --- Start ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
