// frontend/src/components/tasks/Tasks.js
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import io from 'socket.io-client';
import {
  ClipboardCheck,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  X,
  Search,
  AlertCircle,
  Plus
} from 'lucide-react';

// Build socket URL from API base (http://localhost:5000/api -> http://localhost:5000)
const SOCKET_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

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
  const [toast, setToast] = useState(null);

  // Assign Task modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    taskType: '',
    priority: 'Low',
    assignedTo: '',
    equipment: '',
    dueDate: '',
  });

  const itemsPerPage = 8;
  const currentUserId = useMemo(() => (user?._id || user?.id || ''), [user]);
  const isTech = user.role === 'Technician';

  // --- Socket.IO: connect & listen ---
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], withCredentials: false });

    socket.on('connect', () => {
      if (currentUserId) socket.emit('user:join', currentUserId.toString());
    });

    // When a task is assigned to me
    socket.on('task:assigned', ({ task }) => {
      if (task?.assignedTo?._id?.toString() !== currentUserId.toString()) return;
      setTasks(prev => {
        const exists = prev.some(t => t._id === task._id);
        return exists ? prev.map(t => (t._id === task._id ? task : t)) : [task, ...prev];
      });
      setToast(`New task assigned: ${task.title}`);
      setTimeout(() => setToast(null), 3500);
    });

    // When one of my tasks was updated (status)
    socket.on('task:updated', ({ taskId, status }) => {
      setTasks(prev => prev.map(t => (t._id === taskId ? { ...t, status } : t)));
    });

    return () => socket.disconnect();
  }, [currentUserId]);

  // Close modal on ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowAssignModal(false); };
    if (showAssignModal) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAssignModal]);

  // --- Fetch technicians for Engineer dropdown (request ALL) ---
  useEffect(() => {
    let cancelled = false;

    const loadTechs = async () => {
      if (user.role !== 'Engineer') return;
      try {
        const res = await api.get('/users/preapproved/technicians', {
          params: { approved: 'any' } // request ALL technicians, not just approved
        });
        if (!cancelled && res.data?.success) {
          setTechnicians(res.data.technicians || []);
          return;
        }
      } catch {
        // Fallback: fetch all users and filter
        try {
          const res2 = await api.get('/users');
          const all = res2.data?.users || res2.data?.data || [];
          const techs = all.filter(u => u.role === 'Technician');
          if (!cancelled) setTechnicians(techs);
        } catch {
          if (!cancelled) setTechnicians([]);
        }
      }
    };

    loadTechs();
    return () => { cancelled = true; };
  }, [user.role]);

  // --- Fetch equipments for assignment (only if Engineer) ---
  useEffect(() => {
    if (user.role === 'Engineer') {
      api.get('/equipment')
        .then(res => { if (res.data.success) setEquipments(res.data.equipment || []); })
        .catch(() => setEquipments([]));
    }
  }, [user.role]);

  // --- Fetch tasks ---
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchTasks(); }, []);

  // --- Filters ---
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (user.role === 'Engineer' && selectedTechnicianId) {
      filtered = filtered.filter(task => task.assignedTo?._id === selectedTechnicianId);
    }

    if (isTech) {
      filtered = filtered.filter(task => (task.assignedTo?._id || '').toString() === currentUserId.toString());
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        (task.description || '').toLowerCase().includes(q) ||
        (task.title || '').toLowerCase().includes(q) ||
        (task.assignedTo?.name || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [tasks, selectedTechnicianId, user.role, searchTerm, currentUserId, isTech]);

  // --- Pagination ---
  const currentTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTechnicianId]);

  // --- Status update ---
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      // Socket will patch UI; keep a local success
      setSuccessMsg('Task status updated successfully');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // --- Assign Task form handlers ---
  const handleNewTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTaskData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      // Validate required fields
      if (!newTaskData.title || !newTaskData.taskType || !newTaskData.equipment) {
        setError('Please fill in Title, Task Type, and Equipment');
        return;
      }

      const payload = {
        title: newTaskData.title,
        description: newTaskData.description,
        taskType: newTaskData.taskType,
        priority: newTaskData.priority,
        equipment: newTaskData.equipment,
        dueDate: newTaskData.dueDate || undefined
      };
      // assignedTo is optional
      if (newTaskData.assignedTo && newTaskData.assignedTo.trim() !== '') {
        payload.assignedTo = newTaskData.assignedTo;
      }

      await api.post('/tasks', payload);
      setSuccessMsg('Task assigned successfully!');
      setShowAssignModal(false);
      setNewTaskData({
        title: '',
        description: '',
        taskType: '',
        priority: 'Low',
        assignedTo: '',
        equipment: '',
        dueDate: '',
      });
      await fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task');
    }
  };

  // --- UI helpers ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'In Progress':
        return <ArrowRight className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  // --- Loading screen ---
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

  // --- Component render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className="mb-3 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-1">
              <div className="bg-gradient-to-r from-blue-600 to-green-500 p-2 rounded-lg text-white">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              Task Management
            </h1>
            <p className="text-slate-600 mb-4">Manage and track maintenance tasks efficiently</p>
          </div>

          {/* Assign Task button for Engineers */}
          {user.role === 'Engineer' && (
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

        {/* Search & Technician Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks by description, title, or technician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* Technician filter for Engineer */}
          {user.role === 'Engineer' && (
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
                {technicians.map(tech => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMsg && (
          <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded">{successMsg}</div>
        )}
        {error && (
          <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Task count & Pagination info */}
        <div className="mb-6 text-sm text-slate-600 bg-white rounded-xl p-4 border border-slate-200 flex justify-between items-center">
          <div>
            <span className="font-medium">{filteredTasks.length}</span> task{filteredTasks.length !== 1 ? 's' : ''} found
            {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
            {user.role === 'Engineer' && selectedTechnicianId && (
              <span> for <span className="font-medium">{technicians.find(t => t._id === selectedTechnicianId)?.name}</span></span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* No tasks found */}
        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 005.656 0M12 12v.01M7 16v.01M17 16v.01M21 12v.01" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-slate-600">No tasks found</h3>
            <p className="mt-2 text-slate-400">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTasks.map(task => (
            <div
              key={task._id}
              className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                ${isTech && (task.assignedTo?._id || '').toString() === currentUserId.toString() ? 'border-blue-500 ring-1 ring-blue-300' : ''}
              `}
            >
              {/* Status Label */}
              <div className={`flex items-center gap-2 px-4 py-2 ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)}
                <span className="text-sm font-semibold">{task.status}</span>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-800 mb-1 truncate">{task.title}</h3>
                <p className="text-sm text-slate-600 mb-2 truncate">{task.description}</p>

                <div className="text-xs text-slate-400 mb-3 flex flex-wrap gap-2">
                  <div>Priority: {task.priority || 'N/A'}</div>
                  <div>Type: {task.taskType || 'N/A'}</div>
                </div>

                {/* Assigned To */}
                <div className="text-xs text-slate-600 mb-3">
                  Assigned to: <span className="font-medium">{task.assignedTo?.name || 'Unassigned'}</span>
                </div>

                {/* Status Update (only for assigned technician or Admin/Engineer) */}
                {(user.role === 'Admin' || user.role === 'Engineer' || (isTech && (task.assignedTo?._id || '').toString() === currentUserId.toString())) && (
                  <select
                    disabled={updatingTaskId === task._id}
                    value={task.status}
                    onChange={e => handleStatusChange(task._id, e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-3 text-slate-700">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
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
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Assign Task Modal (scroll-safe) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowAssignModal(false)}
          />
          {/* Modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative bg-white w-full max-w-xl rounded-xl shadow-xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <h2 className="text-xl font-semibold">Assign New Task</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 rounded hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body (scrolls) */}
              <div className="px-6 py-4 overflow-y-auto grow">
                <form id="assign-task-form" onSubmit={handleAssignTask} className="space-y-4">
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
                      <option value="Repair">Repair</option>
                      <option value="Install">Install</option>
                      <option value="Inspect">Inspect</option>
                      <option value="Assess">Assess</option>
                      <option value="Calibrate">Calibrate</option>
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
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Assign To (optional)</label>
                    <select
                      name="assignedTo"
                      value={newTaskData.assignedTo}
                      onChange={handleNewTaskChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map(tech => (
                        <option key={tech._id} value={tech._id}>
                          {tech.name}
                        </option>
                      ))}
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
                      {equipments.map(eq => (
                        <option key={eq._id} value={eq._id}>
                          {eq.name} - {eq.serialNumber || 'No S/N'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Due Date</label>
                    <input
                      name="dueDate"
                      type="date"
                      value={newTaskData.dueDate}
                      onChange={handleNewTaskChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </form>
              </div>

              {/* Footer (fixed) */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  form="assign-task-form"
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
