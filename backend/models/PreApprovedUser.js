const mongoose = require('mongoose');

const PreApprovedUserSchema = new mongoose.Schema({
  serviceNumber: { type: String, required: true, unique: true },
  name: String,
  role: {
    type: String,
    enum: ['Engineer', 'Technician', 'Admin'],
    default: 'Technician',
  },
});

module.exports = mongoose.model('PreApprovedUser', PreApprovedUserSchema);
