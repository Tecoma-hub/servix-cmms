// backend/utils/reportGenerator.js
const path = require('path');
const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const ExcelJS = require('exceljs');

// --- Charts (optional) ---
let ChartJSNodeCanvas;
try {
  const { ChartJSNodeCanvas: Canvas } = require('chartjs-node-canvas');
  require('chart.js/auto');
  ChartJSNodeCanvas = Canvas;
} catch (error) {
  console.warn('ChartJS not available:', error.message);
  ChartJSNodeCanvas = null;
}

// --- Mongoose models for real aggregates ---
const Task = require('../models/Task');
const User = require('../models/User');
const Equipment = require('../models/Equipment');

const MIME_TYPES = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const withSoftTimeout = (promise, ms, fallback = null) => {
  let timeout;
  const timer = new Promise(resolve => {
    timeout = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise.finally(() => clearTimeout(timeout)), timer]);
};

const generateChart = async ({ type, data, options, width, height, maxMs, dpr = 2 }) => {
  if (!ChartJSNodeCanvas) return null;
  try {
    const chart = new ChartJSNodeCanvas({
      width, height, backgroundColour: 'white', devicePixelRatio: dpr
    });
    return await withSoftTimeout(chart.renderToBuffer({ type, data, options }), maxMs, null);
  } catch (error) {
    console.error('Chart generation failed:', error);
    return null;
  }
};

const interpolateColor = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  const r = clamped > 0.5 ? 255 : Math.round(510 * clamped);
  const g = clamped > 0.5 ? Math.round(510 * (1 - clamped)) : 255;
  return { r, g, b: 80 };
};

// ------------ DATA LAYER (now DB-backed where possible) ------------
async function fetchReportData({ filters }) {
  const dateMatch = {};
  if (filters?.dateFrom || filters?.dateTo) {
    dateMatch.createdAt = {};
    if (filters.dateFrom) dateMatch.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateMatch.createdAt.$lte = new Date(filters.dateTo);
  }

  // Department/category filters via equipment join (if provided)
  const match = { ...dateMatch };
  const needEquipJoin = (filters?.departments?.length || filters?.categories?.length);

  // ---- Totals by status & type ----
  const totalsAgg = await Task.aggregate([
    { $match: match },
    ...(needEquipJoin ? [
      { $lookup: { from: 'equipment', localField: 'equipment', foreignField: '_id', as: 'eq' } },
      { $unwind: { path: '$eq', preserveNullAndEmptyArrays: true } },
      ...(filters?.departments?.length ? [{ $match: { 'eq.department': { $in: filters.departments } } }] : []),
      ...(filters?.categories?.length ? [{ $match: { 'eq.category': { $in: filters.categories } } }] : []),
    ] : []),
    {
      $group: {
        _id: null,
        pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
        inprog: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
      }
    }
  ]);

  const typesAgg = await Task.aggregate([
    { $match: match },
    ...(needEquipJoin ? [
      { $lookup: { from: 'equipment', localField: 'equipment', foreignField: '_id', as: 'eq' } },
      { $unwind: { path: '$eq', preserveNullAndEmptyArrays: true } },
      ...(filters?.departments?.length ? [{ $match: { 'eq.department': { $in: filters.departments } } }] : []),
      ...(filters?.categories?.length ? [{ $match: { 'eq.category': { $in: filters.categories } } }] : []),
    ] : []),
    { $group: { _id: '$taskType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const totals = {
    status: {
      'Pending': totalsAgg[0]?.pending || 0,
      'In Progress': totalsAgg[0]?.inprog || 0,
      'Completed': totalsAgg[0]?.completed || 0,
      'Cancelled': totalsAgg[0]?.cancelled || 0,
    },
    types: Object.fromEntries(typesAgg.map(t => [t._id || 'N/A', t.count])),
  };

  // ---- Top overdue (dueDate < today and not completed) ----
  const today = new Date();
  const overdue = await Task.find({
    ...match,
    dueDate: { $lt: today },
    status: { $nin: ['Completed'] },
  })
    .populate('equipment', 'name')
    .sort({ dueDate: 1 })
    .limit(10)
    .lean()
    .then(list => list.map(t => ({
      title: t.title || 'Task',
      equipment: t.equipment?.name || '—',
      due: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '—',
      status: t.status || '—'
    })));

  // ---- Performance: ALL staff (technicians & engineers) with tasks in range ----
  const perfAgg = await Task.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$assignedTo',
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        inprog:   { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
        pending:  { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
        cancelled:{ $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
      }
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $match: { 'user.role': { $in: ['Technician', 'Engineer'] } } },
    {
      $project: {
        name: '$user.name', role: '$user.role',
        Completed: '$completed', 'In Progress': '$inprog',
        Pending: '$pending', Cancelled: '$cancelled',
        Total: { $add: ['$completed', '$inprog', '$pending', '$cancelled'] }
      }
    },
    { $sort: { Completed: -1, Total: -1, name: 1 } }
  ]);

  const performance = perfAgg.map(p => ({
    name: p.name || '—',
    role: p.role || '—',
    Completed: p.Completed || 0,
    'In Progress': p['In Progress'] || 0,
    Pending: p.Pending || 0,
    Cancelled: p.Cancelled || 0
  }));

  // ---- Spare parts usage (from tasks.spareParts) ----
  const sparePartsAgg = await Task.aggregate([
    { $match: match },
    { $unwind: { path: '$spareParts', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: '$spareParts.name',
        qtyUsed: { $sum: { $ifNull: ['$spareParts.quantity', 1] } }
      }
    },
    { $sort: { qtyUsed: -1 } },
    { $limit: 20 }
  ]);
  const spareParts = sparePartsAgg.map(s => ({
    part: s._id || '—',
    qtyUsed: s.qtyUsed || 0,
    qtyRequired: 0
  }));

  // ---- Department load (by equipment.department) ----
  const deptAgg = await Task.aggregate([
    { $match: match },
    { $lookup: { from: 'equipment', localField: 'equipment', foreignField: '_id', as: 'eq' } },
    { $unwind: { path: '$eq', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$eq.department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const deptLoad = deptAgg.map(d => ({ dept: d._id || '—', count: d.count || 0 }));

  // ---- Trend (completed over time, by day) ----
  const trendAgg = await Task.aggregate([
    { $match: { ...match, status: 'Completed' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const trend = trendAgg.map(t => ({ date: t._id, count: t.count }));

  // Compliance still placeholder (no explicit schema provided)
  const compliance = [
    { item: 'Electrical Safety Test', passed: 12, failed: 1, dueSoon: 3 },
    { item: 'Calibration Certificates', passed: 9, failed: 0, dueSoon: 4 },
  ];

  return { totals, overdue, performance, spareParts, deptLoad, trend, compliance };
}

// ---------------- PDF WRITER (A4 portrait, better spacing, footer each page) ----------------
class PDFReportWriter {
  constructor() {
    this.PAGE = { w: 595, h: 842 };       // A4 portrait (pt)
    this.MARGIN = 36;                      // 0.5in
    this.CONTENT_W = this.PAGE.w - this.MARGIN * 2;
    this.STYLES = {
      h1:   { size: 20, color: rgb(0,0,0) },
      h2:   { size: 14, color: rgb(0,0,0) },
      body: { size: 11, color: rgb(0.15,0.15,0.15) },
      head: { size: 11, color: rgb(0.1,0.1,0.25) },
    };
    this.SECTION_GAP = 32;                 // distinct spacing between sections
  }
  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.addPage();
    return this;
  }
  addPage() {
    this.page = this.doc.addPage([this.PAGE.w, this.PAGE.h]);
    this.x = this.MARGIN;
    this.y = this.PAGE.h - this.MARGIN;
  }
  drawFooterOn(page) {
    page.drawText('Generated by Servix CMMS', {
      x: this.MARGIN,
      y: this.MARGIN - 12 + 10, // 10pt above absolute bottom
      size: 9,
      font: this.font,
      color: rgb(0.35,0.35,0.35)
    });
  }
  ensureSpace(need = 140) {
    if (this.y - need < this.MARGIN + 24) {
      // put footer on the old page before starting a new one
      this.drawFooterOn(this.page);
      this.addPage();
    }
  }
  gap() {
    this.y -= this.SECTION_GAP;
    if (this.y < this.MARGIN + 140) {
      this.drawFooterOn(this.page);
      this.addPage();
    }
  }
  rule() {
    this.page.drawLine({
      start: { x: this.x, y: this.y },
      end:   { x: this.x + this.CONTENT_W, y: this.y },
      thickness: 0.5,
      color: rgb(0.85,0.87,0.9)
    });
    this.y -= 12;
  }
  text(txt, size = this.STYLES.body.size, bold = false, color = this.STYLES.body.color) {
    const font = bold ? this.bold : this.font;
    this.page.drawText(String(txt ?? ''), { x: this.x, y: this.y, size, font, color });
    this.y -= size + 6;
  }
  h1(t){ this.ensureSpace(60); this.text(t, this.STYLES.h1.size, true, this.STYLES.h1.color); }
  h2(t){ this.ensureSpace(40); this.text(t, this.STYLES.h2.size, true, this.STYLES.h2.color); }

  table(rows, widths, fontSize = 11) {
    // ensure table fits content width
    const total = widths.reduce((a,b)=>a+b,0);
    if (total > this.CONTENT_W) {
      const scale = this.CONTENT_W / total;
      widths = widths.map(w => Math.floor(w * scale));
    }
    const lineH = fontSize + 8;

    // header
    const header = rows[0];
    this.ensureSpace((rows.length+1) * lineH + 20);
    this.page.drawRectangle({ x: this.x, y: this.y - lineH + 4, width: this.CONTENT_W, height: lineH + 4, color: rgb(0.95,0.97,1) });

    let cx = this.x;
    header.forEach((c, i) => {
      this.page.drawText(String(c ?? ''), { x: cx + 4, y: this.y, size: fontSize, font: this.bold, color: this.STYLES.head.color });
      cx += widths[i];
    });
    this.y -= lineH;

    // rows
    for (let r = 1; r < rows.length; r++) {
      const isEven = r % 2 === 0;
      if (isEven) {
        this.page.drawRectangle({ x: this.x, y: this.y - lineH + 4, width: this.CONTENT_W, height: lineH + 4, color: rgb(0.985,0.985,0.985) });
      }
      cx = this.x;
      rows[r].forEach((c, i) => {
        this.page.drawText(String(c ?? ''), { x: cx + 4, y: this.y, size: fontSize, font: this.font, color: this.STYLES.body.color });
        cx += widths[i];
      });
      this.y -= lineH;
      if (this.y < this.MARGIN + 60 && r < rows.length - 1) {
        this.drawFooterOn(this.page);
        this.addPage();
      }
    }
    this.y -= 6;
  }

  async image(buf, origW, origH, label) {
    if (!buf) return;
    const scale = Math.min(1, this.CONTENT_W / origW);
    const w = Math.round(origW * scale);
    const h = Math.round(origH * scale);
    this.ensureSpace(h + 40);
    if (label) this.text(label, this.STYLES.h2.size, true, this.STYLES.h2.color);
    const img = await this.doc.embedPng(buf);
    this.page.drawImage(img, { x: this.x, y: this.y - h, width: w, height: h });
    this.y -= (h + 10);
  }

  async done() {
    // footer on last page
    this.drawFooterOn(this.page);
    // also ensure all pages have footer (safety)
    this.doc.getPages().forEach(p => this.drawFooterOn(p));
    return this.doc.save();
  }
}

// ---------------- EXCEL WRITER (unchanged layout + adds all sections) ----------------
class ExcelReportWriter {
  constructor() {
    this.wb = new ExcelJS.Workbook();
    this.wb.creator = 'Servix CMMS';
    this.wb.created = new Date();
  }
  addSummary(meta) {
    const ws = this.wb.addWorksheet('Summary');
    ws.columns = [{ header: 'Section', width: 30 }, { header: 'Detail', width: 90 }];
    ws.addRow(['Generated', new Date().toLocaleString()]);
    ws.addRow(['Requested By', meta.requestedBy]);
    ws.addRow(['Reports', meta.reports.join(', ')]);
    ws.addRow(['Date From', meta.filters.dateFrom || '—']);
    ws.addRow(['Date To', meta.filters.dateTo || '—']);
    ws.addRow(['Footnote', 'Generated by Servix CMMS']);
  }
  addTasks(data, charts) {
    const ws = this.wb.addWorksheet('Tasks');
    const st = data.totals.status;
    ws.addRow(['Status', 'Count']);
    ws.addRows([['Pending', st['Pending']], ['In Progress', st['In Progress']], ['Completed', st['Completed']], ['Cancelled', st['Cancelled']]]);
    ws.addRow([]);
    ws.addRow(['Type', 'Count']);
    Object.entries(data.totals.types).forEach(([k,v]) => ws.addRow([k, v]));
    if (charts.statusChart) {
      const id = this.wb.addImage({ buffer: charts.statusChart, extension: 'png' });
      ws.addImage(id, { tl: { col: 4, row: 1 }, ext: { width: 520, height: 240 } });
    }
    if (charts.typesChart) {
      const id2 = this.wb.addImage({ buffer: charts.typesChart, extension: 'png' });
      ws.addImage(id2, { tl: { col: 4, row: 18 }, ext: { width: 520, height: 240 } });
    }
  }
  addPerformance(data, charts) {
    const ws = this.wb.addWorksheet('Performance');
    ws.addRow(['Name','Role','Completed','In Progress','Pending','Cancelled','Total']);
    data.performance.forEach(p => ws.addRow([p.name, p.role, p.Completed, p['In Progress'], p.Pending, p.Cancelled, p.Completed + p['In Progress'] + p.Pending + p.Cancelled]));
    if (charts.perfChart) {
      const id = this.wb.addImage({ buffer: charts.perfChart, extension: 'png' });
      ws.addImage(id, { tl: { col: 8, row: 1 }, ext: { width: 520, height: 260 } });
    }
    if (charts.trendChart) {
      const id2 = this.wb.addImage({ buffer: charts.trendChart, extension: 'png' });
      ws.addImage(id2, { tl: { col: 8, row: 25 }, ext: { width: 520, height: 220 } });
    }
  }
  addSpareParts(data, charts) {
    const ws = this.wb.addWorksheet('Spare Parts');
    ws.addRow(['Part','Qty Used','Qty Required']);
    data.spareParts.forEach(s => ws.addRow([s.part, s.qtyUsed, s.qtyRequired || 0]));
    if (charts.partsChart) {
      const id = this.wb.addImage({ buffer: charts.partsChart, extension: 'png' });
      ws.addImage(id, { tl: { col: 5, row: 1 }, ext: { width: 520, height: 260 } });
    }
  }
  addDowntime(data, charts) {
    const ws = this.wb.addWorksheet('Downtime');
    ws.addRow(['Department','Count']);
    data.deptLoad.forEach(d => ws.addRow([d.dept, d.count]));
    if (charts.heatChart) {
      const id = this.wb.addImage({ buffer: charts.heatChart, extension: 'png' });
      ws.addImage(id, { tl: { col: 4, row: 1 }, ext: { width: 520, height: 260 } });
    }
  }
  addCompliance(data) {
    const ws = this.wb.addWorksheet('Compliance');
    ws.addRow(['Item','Passed','Failed','Due Soon']);
    (data.compliance || []).forEach(c => ws.addRow([c.item, c.passed, c.failed, c.dueSoon]));
  }
  async save(file) { await this.wb.xlsx.writeFile(file); }
}

// ---------------- CHARTS ----------------
async function generateCharts(reports, data, cfg) {
  const charts = {};
  if (reports.includes('taskManagement')) {
    const st = data.totals.status;
    charts.statusChart = await generateChart({
      type: 'pie',
      data: { labels: Object.keys(st), datasets: [{ label: 'Status', data: Object.values(st), backgroundColor: ['#fbbf24','#3b82f6','#10b981','#ef4444'] }] },
      options: { plugins: { legend: { position: 'right' } } },
      width: cfg.width, height: cfg.height, maxMs: cfg.maxChartMs
    });
    const tp = data.totals.types;
    charts.typesChart = await generateChart({
      type: 'bar',
      data: { labels: Object.keys(tp), datasets: [{ label: 'Types', data: Object.values(tp), backgroundColor: '#6366f1' }] },
      options: { scales: { y: { beginAtZero: true, grid: { color: '#e5e7eb' } }, x: { grid: { display: false } } } },
      width: cfg.width, height: cfg.height, maxMs: cfg.maxChartMs
    });
  }
  if (reports.includes('staffPerformance')) {
    const names = data.performance.map(p => p.name);
    charts.perfChart = await generateChart({
      type: 'bar',
      data: {
        labels: names,
        datasets: [
          { label: 'Completed', data: data.performance.map(p => p.Completed), backgroundColor: '#10b981' },
          { label: 'In Progress', data: data.performance.map(p => p['In Progress']), backgroundColor: '#3b82f6' },
          { label: 'Pending', data: data.performance.map(p => p.Pending), backgroundColor: '#f59e0b' },
          { label: 'Cancelled', data: data.performance.map(p => p.Cancelled), backgroundColor: '#ef4444' },
        ]
      },
      options: { plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, grid: { color: '#e5e7eb' } }, x: { grid: { display: false } } } },
      width: cfg.width, height: cfg.height, maxMs: cfg.maxChartMs
    });
    charts.trendChart = await generateChart({
      type: 'line',
      data: {
        labels: (data.trend || []).map(t => t.date),
        datasets: [{ label: 'Completed over time', data: (data.trend || []).map(t => t.count), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', fill: true, tension: 0.3 }]
      },
      options: { plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, grid: { color: '#e5e7eb' } }, x: { grid: { display: false } } } },
      width: cfg.width, height: Math.round(cfg.height * 0.7), maxMs: cfg.maxChartMs
    });
  }
  if (reports.includes('inventorySpareParts')) {
    charts.partsChart = await generateChart({
      type: 'bar',
      data: { labels: data.spareParts.map(s => s.part), datasets: [{ label: 'Qty Used', data: data.spareParts.map(s => s.qtyUsed), backgroundColor: '#f59e0b' }] },
      options: { scales: { y: { beginAtZero: true, grid: { color: '#e5e7eb' } }, x: { grid: { display: false } } } },
      width: cfg.width, height: cfg.height, maxMs: cfg.maxChartMs
    });
  }
  if (reports.includes('downtimeAnalysis')) {
    const labels = data.deptLoad.map(d => d.dept);
    const counts = data.deptLoad.map(d => d.count);
    const max = Math.max(1, ...counts);
    const colors = counts.map(v => {
      const { r, g, b } = interpolateColor(1 - (v / max));
      return `rgba(${r},${g},${b},0.9)`;
    });
    charts.heatChart = await generateChart({
      type: 'bar',
      data: { labels, datasets: [{ label: 'Events', data: counts, backgroundColor: colors }] },
      options: { scales: { y: { beginAtZero: true, grid: { color: '#e5e7eb' } }, x: { grid: { display: false } } } },
      width: cfg.width, height: cfg.height, maxMs: cfg.maxHeatmapMs
    });
  }
  return charts;
}

// ---------------- MAIN ----------------
module.exports = async function generateReport({
  reports = [],
  filters = {},
  options = {},
  format = 'pdf',
  requestedBy = 'System',
  outDir = path.join(process.cwd(), 'reports'),
  perf = {},
}) {
  if (!reports.length) throw new Error('Select at least one report type.');
  if (!['pdf', 'xlsx'].includes(format)) throw new Error('Unsupported format.');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const ts = Date.now();
  const filename = `cmms-report-${ts}.${format}`;
  const absolutePath = path.join(outDir, filename);

  const chartCfg = {
    width: perf.chartSize?.w ?? 900,
    height: perf.chartSize?.h ?? 420,
    maxChartMs: perf.maxChartMs ?? 6000,
    maxHeatmapMs: perf.maxHeatmapMs ?? 6000,
  };

  // 1) data
  const data = await fetchReportData({ filters });

  // 2) charts (if visuals enabled)
  const charts = options?.visuals?.charts
    ? await generateCharts(reports, data, chartCfg).catch(() => ({}))
    : {};

  // 3) write
  if (format === 'xlsx') {
    const xw = new ExcelReportWriter();
    xw.addSummary({ reports, filters, requestedBy });
    if (reports.includes('taskManagement')) xw.addTasks(data, charts);
    if (reports.includes('staffPerformance')) xw.addPerformance(data, charts);
    if (reports.includes('inventorySpareParts')) xw.addSpareParts(data, charts);
    if (reports.includes('downtimeAnalysis')) xw.addDowntime(data, charts);
    if (reports.includes('complianceAudit')) xw.addCompliance(data);
    await xw.save(absolutePath);
  } else {
    const pw = await new PDFReportWriter().init();

    // Header
    pw.h1('CMMS Report');
    pw.text(`Generated: ${new Date().toLocaleString()}`);
    pw.text(`Requested By: ${requestedBy}`);
    pw.gap();

    pw.h2('Report Types');
    pw.text(reports.join(', '));
    pw.gap();

    pw.h2('Filters');
    pw.text(`Date From: ${filters.dateFrom || '—'}   •   Date To: ${filters.dateTo || '—'}`);
    pw.text(`Departments: ${filters.departments?.length ? filters.departments.join(', ') : 'All'}`);
    pw.text(`Categories: ${filters.categories?.length ? filters.categories.join(', ') : 'All'}`);
    pw.rule();

    // Task Management
    if (reports.includes('taskManagement')) {
      pw.h2('Task Management — Totals');
      const st = data.totals.status;
      pw.table([['Pending','In Progress','Completed','Cancelled'], [st['Pending'], st['In Progress'], st['Completed'], st['Cancelled']]], [pw.CONTENT_W/4, pw.CONTENT_W/4, pw.CONTENT_W/4, pw.CONTENT_W/4]);
      const typeRows = [['Type','Count'], ...Object.entries(data.totals.types)];
      pw.table(typeRows, [Math.round(pw.CONTENT_W*0.65), Math.round(pw.CONTENT_W*0.35)]);
      await pw.image(charts.statusChart, 900, 420, 'Status Distribution');
      await pw.image(charts.typesChart, 900, 420, 'Types Distribution');
      pw.h2('Top Overdue');
      const overRows = [['Title','Equipment','Due','Status'], ...data.overdue.map(o => [o.title, o.equipment, o.due, o.status])];
      pw.table(overRows, [Math.round(pw.CONTENT_W*0.40), Math.round(pw.CONTENT_W*0.30), Math.round(pw.CONTENT_W*0.15), Math.round(pw.CONTENT_W*0.15)]);
      pw.gap(); pw.rule();
    }

    // Staff Performance
    if (reports.includes('staffPerformance')) {
      pw.h2('Engineer & Technician Performance');
      const perfRows = [['Name','Role','Completed','In Progress','Pending','Cancelled','Total'],
        ...data.performance.map(p => [p.name, p.role, p.Completed, p['In Progress'], p.Pending, p.Cancelled, p.Completed + p['In Progress'] + p.Pending + p.Cancelled])];
      pw.table(perfRows, [Math.round(pw.CONTENT_W*0.32), Math.round(pw.CONTENT_W*0.16), 70, 90, 70, 80, 50]);
      await pw.image(charts.perfChart, 900, 420, 'Tasks by Staff (vertical bars)');
      await pw.image(charts.trendChart, 900, 300, 'Completed Over Time (line)');
      pw.gap(); pw.rule();
    }

    // Spare Parts
    if (reports.includes('inventorySpareParts')) {
      pw.h2('Spare Parts & Inventory');
      const spRows = [['Part','Qty Used','Qty Required'], ...data.spareParts.map(s => [s.part, s.qtyUsed, s.qtyRequired || 0])];
      pw.table(spRows, [Math.round(pw.CONTENT_W*0.6), Math.round(pw.CONTENT_W*0.2), Math.round(pw.CONTENT_W*0.2)]);
      await pw.image(charts.partsChart, 900, 420, 'Top Used Parts');
      pw.gap(); pw.rule();
    }

    // Downtime
    if (reports.includes('downtimeAnalysis')) {
      pw.h2('Downtime Analysis (by Department)');
      if (charts.heatChart) {
        await pw.image(charts.heatChart, 900, 420, 'Events by Department');
      } else {
        const dRows = [['Department','Count'], ...data.deptLoad.map(d => [d.dept, d.count])];
        pw.table(dRows, [Math.round(pw.CONTENT_W*0.7), Math.round(pw.CONTENT_W*0.3)]);
      }
      pw.gap(); pw.rule();
    }

    // Compliance
    if (reports.includes('complianceAudit')) {
      pw.h2('Compliance & Audit');
      const cRows = [['Item','Passed','Failed','Due Soon'], ...(data.compliance || []).map(c => [c.item, c.passed, c.failed, c.dueSoon])];
      pw.table(cRows, [Math.round(pw.CONTENT_W*0.55), Math.round(pw.CONTENT_W*0.15), Math.round(pw.CONTENT_W*0.15), Math.round(pw.CONTENT_W*0.15)]);
    }

    const bytes = await pw.done();
    fs.writeFileSync(absolutePath, bytes);
  }

  return { filename, absolutePath, mimeType: MIME_TYPES[format] };
};
