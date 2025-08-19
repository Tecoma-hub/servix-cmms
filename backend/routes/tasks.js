// backend/routes/tasks.js
const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const Equipment = require('../models/Equipment');
const User = require('../models/User');

const router = express.Router();

/* ---------- helpers ---------- */
const isEngineer = (u) => ['Admin', 'Engineer'].includes(u.role);
const affectsMaintenance = (type) =>
  String(type || '').toLowerCase().match(/repair|calibrat|assess|inspect/);

// prevent empty strings from tripping enum validation
const cleanPM = (obj = {}) => {
  const out = { ...obj };
  if (out.pmType === '') out.pmType = undefined;
  if (out.pmInterval === '') out.pmInterval = undefined;
  return out;
};

const normalizeSpareParts = (parts) => {
  if (!Array.isArray(parts)) return [];
  return parts
    .map((p) => {
      if (typeof p === 'string') {
        const name = p.trim();
        return name ? { name, quantity: 1, description: '' } : null;
      }
      return {
        name: (p?.name || '').toString().trim(),
        quantity: Number(p?.quantity) > 0 ? Number(p.quantity) : 1,
        description: (p?.description || '').toString().trim(),
      };
    })
    .filter(Boolean);
};

/* ------------------------------------------------------------------ */
/* CREATE                                                              */
/* ------------------------------------------------------------------ */
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    if (!isEngineer(req.user)) {
      return res.status(403).json({ message: 'Not authorized to assign tasks' });
    }

    const body = cleanPM(req.body);
    const {
      title,
      description,
      taskType,
      priority = 'Low',
      assignedTo,
      equipment,
      dueDate,
      isPreventive = false,
      pmType,
      pmInterval,
    } = body;

    if (!title || !taskType || !equipment) {
      return res
        .status(400)
        .json({ message: 'title, taskType and equipment are required' });
    }

    const equip = await Equipment.findById(equipment);
    if (!equip) return res.status(404).json({ message: 'Equipment not found' });

    let tech = null;
    if (assignedTo) {
      tech = await User.findById(assignedTo);
      if (!tech || tech.role !== 'Technician') {
        return res
          .status(400)
          .json({ message: 'Assigned user must be a Technician' });
      }
    }

    const task = await Task.create({
      title,
      description,
      taskType,
      priority,
      assignedTo: tech ? tech._id : null,
      assignedBy: req.user._id,
      createdBy: req.user._id,
      equipment: equip._id,
      dueDate,
      isPreventive: !!isPreventive,
      pmType: isPreventive ? pmType : undefined,
      pmInterval: isPreventive ? pmInterval : undefined,
      needsCertification: false,
      certificationEngineer: null,
      certifiedAt: null,
    });

    // For non-install corrective work, mark equipment Under Maintenance immediately
    if (!task.isPreventive && affectsMaintenance(task.taskType)) {
      if (equip.status !== 'Under Maintenance') {
        equip.status = 'Under Maintenance';
        await equip.save();
      }
    }

    req.app.get('io')?.emit('task:created', { taskId: task._id });
    res.status(201).json({ success: true, task });
  })
);

/* ------------------------------------------------------------------ */
/* READ: list                                                          */
/* ------------------------------------------------------------------ */
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const q = {};
    if (req.user.role === 'Technician') {
      q.assignedTo = req.user._id; // tech only sees their own
    }

    // includePreventive=false by default
    if (!('includePreventive' in req.query)) {
      q.isPreventive = { $ne: true };
    } else if (String(req.query.includePreventive) === 'false') {
      q.isPreventive = { $ne: true };
    }

    if (req.query.equipmentId) q.equipment = req.query.equipmentId;

    const tasks = await Task.find(q)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('certificationEngineer', 'name') // ✅ so UI can show “Certified by …”
      .populate('equipment', 'name serialNumber status')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  })
);

/* ------------------------------------------------------------------ */
/* READ: one                                                           */
/* ------------------------------------------------------------------ */
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('certificationEngineer', 'name') // ✅
      .populate(
        'equipment',
        'name serialNumber status location department category'
      );

    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (
      req.user.role === 'Technician' &&
      String(task.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({ success: true, task });
  })
);

/* ------------------------------------------------------------------ */
/* UPDATE STATUS (tech or engineer)                                    */
/* ------------------------------------------------------------------ */
router.put(
  '/:id/status',
  protect,
  asyncHandler(async (req, res) => {
    const valid = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    const { status } = cleanPM(req.body);
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const t = await Task.findById(req.params.id).populate('equipment');
    if (!t) return res.status(404).json({ message: 'Task not found' });

    if (
      req.user.role === 'Technician' &&
      String(t.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    t.status = status;
    if (req.user.role === 'Technician') t.needsCertification = true;

    // Engineer direct status changes should immediately update equipment
    if (isEngineer(req.user) && t.equipment) {
      if (t.status === 'Pending' || t.status === 'In Progress') {
        t.equipment.status = 'Under Maintenance';
      } else if (t.status === 'Completed') {
        t.equipment.status = 'Serviceable';
      } else if (t.status === 'Cancelled') {
        t.equipment.status = 'Decommissioned';
      }
      await t.equipment.save();
      // maintain certification info if setting to Completed and already certified previously
    }

    t.completedDate = status === 'Completed' ? Date.now() : null;

    // PM hygiene
    if (!t.isPreventive) {
      t.pmType = undefined;
      t.pmInterval = undefined;
    } else {
      if (t.pmType === '') t.pmType = undefined;
      if (t.pmInterval === '') t.pmInterval = undefined;
    }

    if (!t.createdBy && t.assignedBy) t.createdBy = t.assignedBy;

    await t.save();

    req.app.get('io')?.emit('task:updated', { taskId: t._id });

    const task = await Task.findById(t._id)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('certificationEngineer', 'name')
      .populate('equipment', 'name serialNumber status');

    res.json({ success: true, task });
  })
);

/* ------------------------------------------------------------------ */
/* ADD/UPDATE WORK (tech or engineer notes)                             */
/* ------------------------------------------------------------------ */
router.put(
  '/:id/work',
  protect,
  asyncHandler(async (req, res) => {
    const t = await Task.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Task not found' });

    if (
      req.user.role === 'Technician' &&
      String(t.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const body = cleanPM(req.body);
    const { faultDescription, repairDetails, sparePartsUsed } = body;

    if (faultDescription !== undefined) {
      t.faultDescription =
        typeof faultDescription === 'string'
          ? faultDescription.trim()
          : faultDescription;
    }
    if (repairDetails !== undefined) {
      t.comments =
        typeof repairDetails === 'string'
          ? repairDetails.trim()
          : repairDetails;
    }
    if (Array.isArray(sparePartsUsed)) {
      t.spareParts = normalizeSpareParts(sparePartsUsed);
    }

    if (!t.isPreventive) {
      t.pmType = undefined;
      t.pmInterval = undefined;
    } else {
      if (t.pmType === '') t.pmType = undefined;
      if (t.pmInterval === '') t.pmInterval = undefined;
    }

    if (!t.createdBy && t.assignedBy) t.createdBy = t.assignedBy;

    t.needsCertification = true;
    await t.save();

    req.app.get('io')?.emit('task:workUpdated', { taskId: t._id });

    const task = await Task.findById(t._id)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('certificationEngineer', 'name')
      .populate('equipment', 'name serialNumber status');

    res.json({ success: true, task });
  })
);

/* ------------------------------------------------------------------ */
/* CERTIFY (engineer/admin only)                                       */
/* ------------------------------------------------------------------ */
router.put(
  '/:id/certify',
  protect,
  asyncHandler(async (req, res) => {
    if (!isEngineer(req.user)) {
      return res
        .status(403)
        .json({ message: 'Only Engineer/Admin can certify' });
    }

    const t = await Task.findById(req.params.id).populate('equipment');
    if (!t) return res.status(404).json({ message: 'Task not found' });

    // mark certification info
    t.needsCertification = false;
    t.certificationEngineer = req.user._id;        // ✅ who certified
    t.certifiedAt = new Date();                    // ✅ when

    if (!t.createdBy && t.assignedBy) t.createdBy = t.assignedBy;

    // PM tidy up
    if (!t.isPreventive) {
      t.pmType = undefined;
      t.pmInterval = undefined;
    } else {
      if (t.pmType === '') t.pmType = undefined;
      if (t.pmInterval === '') t.pmInterval = undefined;
    }

    // Apply equipment transition AFTER certification
    if (t.equipment) {
      if (t.status === 'Pending' || t.status === 'In Progress') {
        t.equipment.status = 'Under Maintenance';
      } else if (t.status === 'Completed') {
        t.equipment.status = 'Serviceable';
      } else if (t.status === 'Cancelled') {
        t.equipment.status = 'Decommissioned';
      }
      await t.equipment.save();
    }

    await t.save();

    req.app.get('io')?.emit('task:certified', { taskId: t._id });

    const task = await Task.findById(t._id)
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('certificationEngineer', 'name')   // ✅ return the engineer’s name
      .populate('equipment', 'name serialNumber status');

    res.json({ success: true, task });
  })
);

/* ------------------------------------------------------------------ */
/* DELETE (engineer/admin only)                                        */
/* ------------------------------------------------------------------ */
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    if (!isEngineer(req.user)) {
      return res
        .status(403)
        .json({ message: 'Only Engineer/Admin can delete' });
    }
    const t = await Task.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Task not found' });

    await t.remove();
    req.app.get('io')?.emit('task:deleted', { taskId: t._id });
    res.json({ success: true, message: 'Task deleted' });
  })
);

module.exports = router;
