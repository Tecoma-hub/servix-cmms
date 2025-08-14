// frontend/src/components/tasks/Tasks.js
import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import {
  ClipboardCheck,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  X as XIcon,
  Search,
  AlertCircle,
  Plus,
  Wrench,
  ListChecks,
  PackagePlus,
  ShieldCheck,
  FilePlus2
} from 'lucide-react';

const TASK_TYPES = ['Repair', 'Install', 'Inspect', 'Assess', 'Calibrate', 'Preventive'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const PM_TYPES = ['Cleaning', 'Lubrication', 'Adjustment', 'Calibrations', 'Safety Testing', 'Filter Replacement'];
const PM_INTERVALS = ['Weekly', 'Monthly', 'Quarterly', 'Biannually', 'Annually'];

function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [equipments, setEquipments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [savingDetailsId, setSavingDetailsId] = useState(null);
  const [certifyingId, setCertifyingId] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    taskType: '',
    pmType: '',
    pmInterval: '',
    priority: 'Low',
    assignedTo: '',
    equipment: '',
    dueDate: '',
  });

  // NEW: which tasks have the “Add Work” editor open
  const [openWorkEditors, setOpenWorkEditors] = useState(new Set());

  const itemsPerPage = 8;

  // Socket.IO live updates
  useEffect(() => {
    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    const refresh = () => fetchTasks();
    socket.on('tasks:created', refresh);
    socket.on('tasks:updated', refresh);
    socket.on('equipment:updated', refresh);
    return () => {
      socket.off('tasks:created', refresh);
      socket.off('tasks:updated', refresh);
      socket.off('equipment:updated', refresh);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch helpers
  useEffect(() => {
    if (user?.role === 'Engineer' || user?.role === 'Admin') {
      api
        .get('/users/preapproved/technicians?approved=any&limit=200')
        .then((res) => res.data.success && setTechnicians(res.data.technicians || []))
        .catch(() => setTechnicians([]));
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'Engineer' || user?.role === 'Admin') {
      api
        .get('/equipment')
        .then((res) => res.data.success && setEquipments(res.data.equipment || []))
        .catch(() => setEquipments([]));
    }
  }, [user?.role]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const url = user?.role === 'Technician' ? '/tasks?my=1' : '/tasks';
      const res = await api.get(url);
      setTasks(res.data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if ((user.role === 'Engineer' || user.role === 'Admin') && selectedTechnicianId) {
      filtered = filtered.filter((t) => t.assignedTo?._id === selectedTechnicianId);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.assignedTo?.name || '').toLowerCase().includes(q) ||
          (t.equipment?.name || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [tasks, selectedTechnicianId, user, searchTerm]);

  const itemsPerPageCount = Math.max(1, 8);
  const currentTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPageCount;
    return filteredTasks.slice(start, start + itemsPerPageCount);
  }, [filteredTasks, currentPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, selectedTechnicianId]);

  // Visual helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'In Progress': return <ArrowRight className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Cancelled': return <XIcon className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Technician/Engineer status update
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      await fetchTasks();
      setSuccessMsg('Task status submitted. Awaiting certification.');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Certify (Engineer/Admin only)
  const certifyTask = async (taskId) => {
    try {
      setCertifyingId(taskId);
      await api.put(`/tasks/${taskId}/certify`);
      await fetchTasks();
      setSuccessMsg('Task certified. Equipment updated.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to certify task');
    } finally {
      setCertifyingId(null);
    }
  };

  // Work details editor
  const [detailsDraft, setDetailsDraft] = useState({});
  const changeDraft = (taskId, field, value) =>
    setDetailsDraft((prev) => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), [field]: value } }));

  const saveWorkDetails = async (task) => {
    try {
      setSavingDetailsId(task._id);
      const draft = detailsDraft[task._id] || {};
      const spareParts = (draft.sparePartsText || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const qtyMatch = line.match(/x\s*(\d+)/i);
          const [nameAndMaybeDash] = line.split(/x\s*\d+/i);
          const [name, desc = ''] = (nameAndMaybeDash || '').split(' - ');
          return {
            name: (name || '').trim(),
            quantity: qtyMatch ? parseInt(qtyMatch[1], 10) : 1,
            description: (desc || '').trim()
          };
        });
      await api.put(`/tasks/${task._id}`, {
        faultDescription: draft.faultDescription ?? '',
        repairDetails: draft.repairDetails ?? '',
        spareParts
      });
      await fetchTasks();
      setSuccessMsg('Work details saved');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save work details');
    } finally {
      setSavingDetailsId(null);
    }
  };

  // Assign Task handlers
  const handleNewTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newTaskData.title || !newTaskData.taskType || !newTaskData.equipment || !newTaskData.dueDate) {
      setError('Please fill in Title, Task Type, Equipment and Due Date');
      return;
    }
    if (newTaskData.taskType === 'Preventive' && (!newTaskData.pmType || !newTaskData.pmInterval)) {
      setError('For Preventive tasks, select PM Type and Periodic Interval.');
      return;
    }

    await api.post('/tasks', {
      title: newTaskData.title,
      description: newTaskData.description,
      taskType: newTaskData.taskType,
      pmType: newTaskData.taskType === 'Preventive' ? newTaskData.pmType : undefined,
      pmInterval: newTaskData.taskType === 'Preventive' ? newTaskData.pmInterval : undefined,
      priority: newTaskData.priority,
      assignedTo: newTaskData.assignedTo || undefined,
      equipment: newTaskData.equipment,
      dueDate: newTaskData.dueDate
    });

    setSuccessMsg('Task assigned successfully!');
    setShowAssignModal(false);
    setNewTaskData({
      title: '',
      description: '',
      taskType: '',
      pmType: '',
      pmInterval: '',
      priority: 'Low',
      assignedTo: '',
      equipment: '',
      dueDate: ''
    });
    await fetchTasks();
  };

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPageCount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-xl text-slate-600">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-1">
              <div className="bg-gradient-to-r from-blue-600 to-green-500 p-2 rounded-lg text-white">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              Task Management
            </h1>
            <p className="text-slate-600 mb-4">Technicians update status & work; Engineers certify to apply inventory changes.</p>
          </div>

          {(user.role === 'Engineer' || user.role === 'Admin') && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              title="Assign New Task"
            >
              <Plus className="w-5 h-5" />
              Assign Task
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks by description, title, equipment, or technician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 placeholder-slate-400"
            />
          </div>

          {(user.role === 'Engineer' || user.role === 'Admin') && (
            <div className="relative w-60">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <select
                value={selectedTechnicianId}
                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                className="pl-10 pr-8 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 bg-white"
              >
                <option value="">All Technicians</option>
                {technicians.map((tech) => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Flash messages */}
        {successMsg && <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded">{successMsg}</div>}
        {error && (
          <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Summary line */}
        <div className="mb-6 text-sm text-slate-600 bg-white rounded-xl p-4 border border-slate-200 flex justify-between items-center">
          <div>
            <span className="font-medium">{filteredTasks.length}</span> task{filteredTasks.length !== 1 ? 's' : ''} found
            {searchTerm && <> matching "<span className="font-medium">{searchTerm}</span>"</>}
            {(user.role === 'Engineer' || user.role === 'Admin') && selectedTechnicianId && (
              <> for <span className="font-medium">{technicians.find((t) => t._id === selectedTechnicianId)?.name}</span></>
            )}
          </div>
          {Math.ceil(filteredTasks.length / itemsPerPageCount) > 1 && (
            <div className="text-sm text-slate-500">
              Page {currentPage} of {Math.ceil(filteredTasks.length / itemsPerPageCount)}
            </div>
          )}
        </div>

        {/* Empty state */}
        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-slate-600">No tasks found</h3>
            <p className="mt-2 text-slate-400">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Tasks grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTasks.map((task) => {
            const draft = detailsDraft[task._id] || {};

// Support both shapes: assignedTo = {_id: "..."} OR assignedTo = "..."
const assignedId =
  typeof task.assignedTo === 'string'
    ? task.assignedTo
    : task.assignedTo?._id;

const userId = user?._id || user?.id; // tolerate either key

const canEditWork =
  user.role === 'Technician' &&
  assignedId &&
  userId &&
  String(assignedId) === String(userId) &&
  !task.certified;


            const isOpen = openWorkEditors.has(task._id);

            const toggleWorkEditor = () => {
              setOpenWorkEditors((prev) => {
                const next = new Set(prev);
                if (next.has(task._id)) next.delete(task._id);
                else next.add(task._id);
                return next;
              });
            };

            return (
              <div
                key={task._id}
                className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  canEditWork ? 'border-blue-500 ring-1 ring-blue-300' : ''
                }`}
              >
                {/* Header status strip */}
                <div className={`flex items-center gap-2 px-4 py-2 ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                  <span className="text-sm font-semibold">{task.status}</span>
                  {task.awaitingCertification && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      <ShieldCheck className="w-3 h-3" />
                      Awaiting Certification
                    </span>
                  )}
                  {task.certified && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Certified
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
                  <p className="text-sm text-slate-600">{task.description}</p>

                  <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1"><Wrench className="w-3 h-3" />Type: {task.taskType || 'N/A'}</span>
                    {task.taskType === 'Preventive' && task.pmType && (
                      <span className="inline-flex items-center gap-1"><ListChecks className="w-3 h-3" />PM: {task.pmType} • {task.pmInterval}</span>
                    )}
                    <span>Priority: {task.priority}</span>
                    {task.equipment?.name && <span>Equipment: {task.equipment.name}</span>}
                    {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>

                  <div className="text-xs text-slate-600">
                    Assigned to: <span className="font-medium">{task.assignedTo?.name || 'Unassigned'}</span>
                  </div>

                  {/* Status select & certify */}
                  {(user.role === 'Admin' || user.role === 'Engineer' || (user.role === 'Technician' && task.assignedTo?._id === user._id)) && (
                    <div className="flex gap-2">
                      <select
                        disabled={updatingTaskId === task._id}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {(user.role === 'Admin' || user.role === 'Engineer') && task.awaitingCertification && (
                        <button
                          onClick={() => certifyTask(task._id)}
                          disabled={certifyingId === task._id}
                          className="whitespace-nowrap px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                          title="Certify (apply to inventory)"
                        >
                          {certifyingId === task._id ? 'Certifying…' : 'Certify'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ---------- NEW: Add Work button for Technician ---------- */}
                  {canEditWork && (
                    <div className="pt-2">
                      <button
                        onClick={toggleWorkEditor}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <FilePlus2 className="w-4 h-4" />
                        {isOpen ? 'Hide Work' : 'Add Work'}
                      </button>
                    </div>
                  )}

                  {/* Work editor (collapsible) */}
                  {canEditWork && isOpen && (
                    <div className="mt-3 border rounded-xl border-slate-200 bg-slate-50 p-3">
                      <div className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <PackagePlus className="w-4 h-4 text-blue-600" />
                        Work Details
                      </div>

                      <label className="text-xs text-slate-500">Fault description</label>
                      <textarea
                        value={draft.faultDescription ?? task.faultDescription ?? ''}
                        onChange={(e) => changeDraft(task._id, 'faultDescription', e.target.value)}
                        rows={2}
                        className="w-full mt-1 mb-2 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <label className="text-xs text-slate-500">Repair details</label>
                      <textarea
                        value={draft.repairDetails ?? task.repairDetails ?? ''}
                        onChange={(e) => changeDraft(task._id, 'repairDetails', e.target.value)}
                        rows={2}
                        className="w-full mt-1 mb-2 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <label className="text-xs text-slate-500">
                        Spare Parts Used/Required <span className="text-slate-400">(one per line, e.g. “Filter x 2 - HEPA”)</span>
                      </label>
                      <textarea
                        value={
                          draft.sparePartsText ??
                          (Array.isArray(task.spareParts) && task.spareParts.length
                            ? task.spareParts.map((p) => `${p.name || ''} x ${p.quantity || 1}${p.description ? ` - ${p.description}` : ''}`).join('\n')
                            : '')
                        }
                        onChange={(e) => changeDraft(task._id, 'sparePartsText', e.target.value)}
                        rows={3}
                        className="w-full mt-1 mb-3 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="flex justify-end">
                        <button
                          onClick={() => saveWorkDetails(task)}
                          disabled={savingDetailsId === task._id}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingDetailsId === task._id ? 'Saving…' : 'Save Details'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Read-only technician notes for Engineer/Admin */}
                  {(user.role === 'Engineer' || user.role === 'Admin') &&
                    (task.faultDescription || task.repairDetails || (task.spareParts || []).length > 0) && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <div className="text-sm font-semibold text-slate-800 mb-1">Technician Notes</div>
                        {task.faultDescription && (
                          <div className="text-sm mb-1"><span className="font-medium">Fault:</span> {task.faultDescription}</div>
                        )}
                        {task.repairDetails && (
                          <div className="text-sm mb-1"><span className="font-medium">Repair:</span> {task.repairDetails}</div>
                        )}
                        {(task.spareParts || []).length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Spare Parts:</span>
                            <ul className="list-disc ml-5 mt-1">
                              {task.spareParts.map((p, idx) => (
                                <li key={idx}>{p.name} x {p.quantity}{p.description ? ` — ${p.description}` : ''}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-3 text-slate-700">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50"
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 ${currentPage === i + 1 ? 'bg-blue-600 text-white' : ''}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Assign Task Modal (scrollable) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold">Assign New Task</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-slate-700">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 64px)' }}>
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Title *</label>
                  <input
                    name="title"
                    value={newTaskData.title}
                    onChange={handleNewTaskChange}
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Description</label>
                  <textarea
                    name="description"
                    value={newTaskData.description}
                    onChange={handleNewTaskChange}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Task Type *</label>
                    <select
                      name="taskType"
                      value={newTaskData.taskType}
                      onChange={handleNewTaskChange}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Task Type</option>
                      {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Priority</label>
                    <select
                      name="priority"
                      value={newTaskData.priority}
                      onChange={handleNewTaskChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                {newTaskData.taskType === 'Preventive' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">PM Type *</label>
                      <select
                        name="pmType"
                        value={newTaskData.pmType}
                        onChange={handleNewTaskChange}
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {PM_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 font-medium">Periodic Interval *</label>
                      <select
                        name="pmInterval"
                        value={newTaskData.pmInterval}
                        onChange={handleNewTaskChange}
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {PM_INTERVALS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Assign To (optional)</label>
                    <select
                      name="assignedTo"
                      value={newTaskData.assignedTo}
                      onChange={handleNewTaskChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Equipment *</label>
                    <select
                      name="equipment"
                      value={newTaskData.equipment}
                      onChange={handleNewTaskChange}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Equipment</option>
                      {equipments.map((eq) => (
                        <option key={eq._id} value={eq._id}>
                          {eq.name}{eq.serialNumber ? ` - ${eq.serialNumber}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Due Date *</label>
                  <input
                    name="dueDate"
                    type="date"
                    value={newTaskData.dueDate}
                    onChange={handleNewTaskChange}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
