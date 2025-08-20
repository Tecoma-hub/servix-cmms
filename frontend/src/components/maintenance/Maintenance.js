// frontend/src/components/maintenance/Maintenance.js
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { Wrench, Plus, Calendar, ClipboardList, AlertCircle, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';

const socketURL = 'http://localhost:5000';

const PM_TASK_TYPES = [
  'Cleaning',
  'Lubrication',
  'Adjustment',
  'Calibrations',
  'Safety Testing',
  'Filter Replacement'
];

const PM_INTERVALS = [
  'Weekly',
  'Biweekly',
  'Monthly',
  'Quarterly',
  'Biannually',
  'Annually',
  'Every 2 Years'
];

const ITEMS_PER_PAGE = 8; // pagination size for history

const Maintenance = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [upcomingPM, setUpcomingPM] = useState([]); // unassigned PM
  const [history, setHistory] = useState([]);       // completed

  // Search + pagination (history)
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // PM modal
  const [showPM, setShowPM] = useState(false);
  const [pmForm, setPmForm] = useState({
    title: '',
    description: '',
    taskType: PM_TASK_TYPES[0],
    priority: 'Low',
    assignedTo: '',      // <-- NEW (optional)
    equipment: '',
    pmInterval: 'Monthly', // <-- NEW periodic interval
    dueDate: ''
  });

  const getAll = async () => {
    try {
      setLoading(true);
      setError('');

      // inventory (for dropdown)
      const eqRes = await api.get('/equipment');
      setEquipments(eqRes.data?.equipment || []);

      // technicians (pre-approved only)
      if (user?.role === 'Engineer' || user?.role === 'Admin') {
        const techRes = await api.get('/users/preapproved/technicians?approved=true');
        setTechnicians(techRes.data?.technicians || []);
      } else {
        setTechnicians([]);
      }

      // tasks for views
      const tRes = await api.get('/tasks');
      const all = tRes.data?.tasks || [];

      // Preventive (by our rule: UNASSIGNED & not closed)
      const pm = all
        .filter(t =>
          !t.assignedTo &&
          t.status !== 'Completed' &&
          t.status !== 'Cancelled'
        )
        .sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt));
      setUpcomingPM(pm);

      // History: Completed only (full list; we’ll paginate in UI)
      const hist = all
        .filter(t => t.status === 'Completed')
        .sort((a, b) => new Date(b.completedDate || b.updatedAt || b.createdAt) - new Date(a.completedDate || a.updatedAt || a.createdAt));
      setHistory(hist);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch maintenance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Live
  useEffect(() => {
    const s = io(socketURL, { transports: ['websocket'] });
    const refresh = () => getAll();
    s.on('task:created', refresh);
    s.on('task:updated', refresh);
    s.on('task:statusChanged', refresh);
    s.on('equipment:statusChanged', refresh);
    return () => {
      s.off('task:created', refresh);
      s.off('task:updated', refresh);
      s.off('task:statusChanged', refresh);
      s.off('equipment:statusChanged', refresh);
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const statusBadge = s => ({
    'Completed':      'bg-green-100 text-green-700 border border-green-200',
    'In Progress':    'bg-blue-100 text-blue-700 border border-blue-200',
    'Pending':        'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'Cancelled':      'bg-red-100 text-red-700 border border-red-200'
  }[s] || 'bg-slate-100 text-slate-700 border border-slate-200');

  // Search filter (applies to both panels)
  const matchesSearch = (t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.taskType || '').toLowerCase().includes(q) ||
      (t.status || '').toLowerCase().includes(q) ||
      (t.priority || '').toLowerCase().includes(q) ||
      (t.pmInterval || '').toLowerCase().includes(q) ||
      (t.equipment?.name || '').toLowerCase().includes(q) ||
      (t.assignedTo?.name || '').toLowerCase().includes(q)
    );
  };

  const filteredPM = useMemo(
    () => upcomingPM.filter(matchesSearch),
    [upcomingPM, search]
  );

  const filteredHistory = useMemo(
    () => history.filter(matchesSearch),
    [history, search]
  );

  // Pagination for history
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const pageClamped = Math.min(page, totalPages);
  const start = (pageClamped - 1) * ITEMS_PER_PAGE;
  const currentHistory = filteredHistory.slice(start, start + ITEMS_PER_PAGE);

  // PM modal handlers
  const openPM = () => setShowPM(true);
  const closePM = () => {
    setShowPM(false);
    setPmForm({
      title: '',
      description: '',
      taskType: PM_TASK_TYPES[0],
      priority: 'Low',
      assignedTo: '',
      equipment: '',
      pmInterval: 'Monthly',
      dueDate: ''
    });
  };
  const onPMChange = (e) => setPmForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submitPM = async (e) => {
    e.preventDefault();
    setError('');

    const { title, equipment, taskType, dueDate } = pmForm;
    if (!title || !equipment || !taskType || !dueDate) {
      setError('Please complete all required fields.');
      return;
    }

    try {
      await api.post('/tasks', {
        ...pmForm,
        assignedTo: pmForm.assignedTo || undefined,
      });

      closePM();
      await getAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule preventive task');
    }
  };

  const fmtDate = (d) => {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-xl text-slate-600">Loading maintenance…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header & Actions */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-green-500 flex items-center justify-center text-white">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Maintenance Management</h1>
              <p className="text-slate-600">Plan, schedule, and review.</p>
            </div>
          </div>

          <div className="flex-1 md:flex-none">
            {/* Global search */}
            <div className="relative max-w-md ml-auto">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, equipment, type, status, technician…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {(user?.role === 'Engineer' || user?.role === 'Admin') && (
              <button onClick={openPM} className="inline-flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                <Calendar className="w-5 h-5" /> Schedule Preventive
              </button>
            )}
            <a href="/report-issue" className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl">
              <AlertCircle className="w-5 h-5" /> Report Issue
            </a>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preventive (UNASSIGNED only) */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" /> Preventive Maintenance
              </h2>
              <span className="text-sm text-slate-500">{filteredPM.length} item{filteredPM.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="p-6">
              {filteredPM.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="mx-auto h-14 w-14 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6m9 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-3 text-slate-600">No preventive items. Schedule one to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPM.map(t => (
                    <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-3">
                          <div className="font-semibold text-slate-800 truncate">{t.title}</div>
                          {t.description && <div className="text-sm text-slate-600 mt-1 line-clamp-2">{t.description}</div>}
                          <div className="mt-2 text-xs text-slate-500">
                            Equipment: {t.equipment?.name || '—'} {t.equipment?.serialNumber ? `• S/N ${t.equipment.serialNumber}` : ''}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(t.status)}`}>
                          {t.status}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Type: {t.taskType || 'N/A'} • Priority: {t.priority || 'N/A'} • Interval: {t.pmInterval || '—'} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Maintenance History (search + pagination) */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" /> Maintenance History
              </h2>
              <span className="text-sm text-slate-500">
                {filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-6">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="mx-auto h-14 w-14 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6m9 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-3 text-slate-600">No maintenance history yet.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {currentHistory.map(t => (
                      <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 pr-3">
                            <div className="text-slate-800 font-semibold truncate">{t.title}</div>
                            {t.description && <div className="text-sm text-slate-600 mt-1 line-clamp-2">{t.description}</div>}

                            {(t.faultDescription || t.comments || (t.spareParts?.length > 0)) && (
                              <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                {t.faultDescription && <div className="text-sm text-slate-700"><span className="font-medium">Fault:</span> {t.faultDescription}</div>}
                                {t.comments && <div className="text-sm text-slate-700"><span className="font-medium">Repair Details:</span> {t.comments}</div>}
                                {t.spareParts?.length > 0 && (
                                  <div className="text-sm text-slate-700">
                                    <span className="font-medium">Spare Parts:</span>{' '}
                                    {t.spareParts.map((p, i) => <span key={i} className="mr-2">{p.name}({p.quantity || 1})</span>)}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="mt-2 text-xs text-slate-500">
                              Equipment: {t.equipment?.name || '—'}
                              {t.assignedTo?.name ? ` • Technician: ${t.assignedTo.name}` : ''}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap">
                            {fmtDate(t.completedDate || t.updatedAt || t.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination controls */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="text-sm text-slate-600">
                      Page <span className="font-medium">{pageClamped}</span> of <span className="font-medium">{totalPages}</span> • Showing{' '}
                      <span className="font-medium">
                        {Math.min(filteredHistory.length, start + 1)}–{Math.min(filteredHistory.length, start + currentHistory.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredHistory.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={pageClamped === 1}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={pageClamped === totalPages}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Preventive Modal */}
      {showPM && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center overflow-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-10">
            <h3 className="text-xl font-semibold mb-4">Schedule Preventive Task</h3>
            <form onSubmit={submitPM} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium">Title *</label>
                <input
                  name="title" value={pmForm.title} onChange={onPMChange} required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  name="description" rows={3} value={pmForm.description} onChange={onPMChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">PM Type *</label>
                  <select
                    name="taskType" value={pmForm.taskType} onChange={onPMChange} required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    {PM_TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Priority</label>
                  <select
                    name="priority" value={pmForm.priority} onChange={onPMChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Periodic Interval *</label>
                  <select
                    name="pmInterval" value={pmForm.pmInterval} onChange={onPMChange} required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    {PM_INTERVALS.map(iv => <option key={iv} value={iv}>{iv}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Due Date *</label>
                  <input
                    type="date" name="dueDate" value={pmForm.dueDate} onChange={onPMChange} required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Assigned To (optional) */}
              {(user?.role === 'Engineer' || user?.role === 'Admin') && (
                <div>
                  <label className="block text-sm font-medium">Assign To (optional)</label>
                  <div className="relative">
                    <select
                      name="assignedTo"
                      value={pmForm.assignedTo}
                      onChange={onPMChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned (show in Preventive)</option>
                      {technicians.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                    <Users className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Tip: Leaving this unassigned keeps it visible in the Preventive list.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium">Equipment *</label>
                <select
                  name="equipment" value={pmForm.equipment} onChange={onPMChange} required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Equipment</option>
                  {equipments.map(eq => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} {eq.serialNumber ? `- ${eq.serialNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closePM}
                        className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">Cancel</button>
                <button type="submit"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
