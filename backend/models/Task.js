// backend/models/Task.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PM_TYPES = [
  'Cleaning',
  'Lubrication',
  'Adjustment',
  'Calibration',
  'Safety Testing',
  'Filter Replacement',
];

const PM_INTERVALS = ['Weekly', 'Monthly', 'Biannually', 'Annually'];

/** Spare part subdocument */
const SparePartSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    taskType: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Low',
    },

    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },

    dueDate: { type: Date },
    completedDate: { type: Date },

    isPreventive: { type: Boolean, default: false },

    pmType: {
      type: String,
      enum: PM_TYPES,
      set: v => (v === '' ? undefined : v),
      required: function () { return this.isPreventive === true; },
    },
    pmInterval: {
      type: String,
      enum: PM_INTERVALS,
      set: v => (v === '' ? undefined : v),
      required: function () { return this.isPreventive === true; },
    },

    // Spare parts as structured subdocs
    spareParts: { type: [SparePartSchema], default: [] },

    // Technician notes
    faultDescription: { type: String, trim: true },
    comments: { type: String, trim: true }, // repair details

    // Certification workflow
    needsCertification: { type: Boolean, default: false },

    // ✅ NEW: who certified + when (used for "Certified by <name>")
    certificationEngineer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    certifiedAt: { type: Date, default: null },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: function () { return this.assignedBy || undefined; },
    },
  },
  { timestamps: true }
);

// ---- Legacy data & normalizers ----
TaskSchema.pre('validate', function (next) {
  if (this.pmType === '') this.pmType = undefined;
  if (this.pmInterval === '') this.pmInterval = undefined;
  if (this.isPreventive !== true) {
    this.pmType = undefined;
    this.pmInterval = undefined;
  }
  if (!this.createdBy && this.assignedBy) this.createdBy = this.assignedBy;

  // If legacy spareParts were strings, normalize to objects
  if (Array.isArray(this.spareParts) && this.spareParts.length) {
    this.spareParts = this.spareParts.map(p => {
      if (typeof p === 'string') {
        const name = p.trim();
        return name ? { name, quantity: 1, description: '' } : null;
      }
      return {
        name: (p?.name || '').toString().trim(),
        quantity: Number(p?.quantity) > 0 ? Number(p.quantity) : 1,
        description: (p?.description || '').toString().trim(),
      };
    }).filter(Boolean);
  }

  next();
});

TaskSchema.virtual('awaitingCertification').get(function () {
  return this.needsCertification === true;
});

TaskSchema.set('toJSON', { virtuals: true, versionKey: false });

module.exports = mongoose.model('Task', TaskSchema);
module.exports.PM_TYPES = PM_TYPES;
module.exports.PM_INTERVALS = PM_INTERVALS;
