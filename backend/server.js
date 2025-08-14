// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Task = require('./models/Task');
const Equipment = require('./models/Equipment');

dotenv.config({ path: './.env' });

if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log('MongoDB Connection Error:', err));

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', credentials: true }
});
app.set('io', io);

io.on('connection', (socket) => {
  // console.log('socket connected', socket.id);
  socket.on('disconnect', () => {});
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Servix CMMS API is running' });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

// --- Overdue sweep: every 10 minutes set equipment to Unserviceable when dueDate passed ---
const runOverdueSweep = async () => {
  try {
    const now = new Date();
    // Find overdue tasks that are not certified/cancelled/completed
    const overdue = await Task.find({
      dueDate: { $lte: now },
      certified: { $ne: true },
      status: { $nin: ['Completed', 'Cancelled'] }
    }).select('equipment');

    const eqIds = [...new Set(overdue.map(t => t.equipment?.toString()).filter(Boolean))];
    if (eqIds.length) {
      await Equipment.updateMany(
        { _id: { $in: eqIds }, status: { $ne: 'Unserviceable' } },
        { $set: { status: 'Unserviceable' } }
      );
      eqIds.forEach(id => io.emit('equipment:updated', { equipmentId: id, status: 'Unserviceable' }));
    }
  } catch (e) {
    console.error('Overdue sweep error:', e.message);
  }
};

// Kick off interval
setInterval(runOverdueSweep, 10 * 60 * 1000); // every 10 minutes
// Also run once on boot after DB connects
mongoose.connection.once('open', () => setTimeout(runOverdueSweep, 3000));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
