// backend/routes/reports.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const generateReport = require('../utils/reportGenerator');

const router = express.Router();

// Only Engineers can generate reports
const isEngineerOnly = (user) => user?.role === 'Engineer';

router.post(
  '/generate',
  protect,
  asyncHandler(async (req, res) => {
    if (!isEngineerOnly(req.user)) {
      return res.status(403).json({ message: 'Only Engineers can generate reports.' });
    }

    const { reports = [], filters = {}, options = {} } = req.body || {};

    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ message: 'Select at least one report type.' });
    }

    const format = (options?.format || 'pdf').toLowerCase();
    const allowed = ['pdf', 'xlsx'];
    if (!allowed.includes(format)) {
      return res.status(400).json({ message: 'Unsupported format.' });
    }

    const outDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const { filename, absolutePath, mimeType } = await generateReport({
      reports,
      filters,
      options,
      format,
      requestedBy: req.user?.name || 'Engineer',
      outDir,
    });

    // If the client wants a direct blob stream:
    if (req.headers['x-return-blob'] === '1') {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      fs.createReadStream(absolutePath).pipe(res);
      return;
    }

    // Otherwise send a temporary URL
    const fileUrl = `${req.protocol}://${req.get('host')}/downloads/${filename}`;
    res.json({ success: true, fileUrl });
  })
);

module.exports = router;
