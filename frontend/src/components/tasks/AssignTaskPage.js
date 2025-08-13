// frontend/src/components/tasks/AssignTaskPage.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const TASK_TYPES = [
  'Inspection',
  'Installation',
  'Corrective Maintenance',
  'Decommissioning',
  'Calibration',
];

const AssignTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // For assignment form
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // For task filtering by task type
  const [filterTaskType, setFilterTaskType] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [tasksRes, usersRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/users')
        ]);

        setTasks(tasksRes.data.tasks || []);
        // Filter users to technicians only
        const technicians = usersRes.data.users.filter(user => user.role === 'Technician');
        setUsers(technicians);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tasks based on selected filterTaskType
  const filteredTasks = filterTaskType
    ? tasks.filter(task => task.taskType === filterTaskType)
    : tasks;

  const handleAssignTask = async (e) => {
    e.preventDefault();

    if (!selectedTaskType) {
      setError('Please select a task type');
      return;
    }

    if (!selectedTask || !selectedUser) {
      setError('Please select both a task and a technician');
      return;
    }

    try {
      setAssignLoading(true);
      setError('');

      await api.put(`/tasks/${selectedTask}/assign`, {
        assignedTo: selectedUser,
        taskType: selectedTaskType,
      });

      // Update local state to reflect assignment and task type update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === selectedTask
            ? { ...task, assignedTo: users.find(u => u._id === selectedUser), taskType: selectedTaskType }
            : task
        )
      );

      // Reset selections
      setSelectedTask('');
      setSelectedUser('');
      setSelectedTaskType('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task');
    } finally {
      setAssignLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'text-red-600 bg-red-50';
      case 'High':
        return 'text-orange-600 bg-orange-50';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'Low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-6 text-xl text-slate-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-800 px-8 py-6 rounded-2xl max-w-md text-center">
          <div className="flex items-start justify-center">
            <svg className="w-6 h-6 mt-0.5 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-500 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Assign Tasks</h1>
              <p className="text-slate-600">Manage task assignments for technicians</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll wrapper for form and list */}
      <div
        className="max-w-7xl mx-auto px-6 py-8"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Assignment Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-8">
          <div className="px-8 py-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Assign Task to Technician
            </h2>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong className="font-medium">Error:</strong> {error}
                </div>
              </div>
            )}

            <form onSubmit={handleAssignTask} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task Type selector */}
                <div className="space-y-2">
                  <label htmlFor="taskType" className="block text-sm font-semibold text-slate-700">
                    Select Task Type *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <select
                      id="taskType"
                      value={selectedTaskType}
                      onChange={(e) => setSelectedTaskType(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                      required
                    >
                      <option value="">Choose a task type</option>
                      {TASK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Select Task */}
                <div className="space-y-2">
                  <label htmlFor="task" className="block text-sm font-semibold text-slate-700">
                    Select Task *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <select
                      id="task"
                      value={selectedTask}
                      onChange={(e) => setSelectedTask(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                      required
                    >
                      <option value="">Choose a task</option>
                      {tasks.map((task) => (
                        <option key={task._id} value={task._id}>
                          {task.title} - {task.equipmentId?.name || 'Unknown Equipment'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Select Technician */}
                <div className="space-y-2">
                  <label htmlFor="technician" className="block text-sm font-semibold text-slate-700">
                    Select Technician *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <select
                      id="technician"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                      required
                    >
                      <option value="">Choose a technician</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {assignLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Assigning...
                    </div>
                  ) : (
                    'Assign Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Task List with Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              All Tasks
            </h2>

            <div className="flex items-center gap-3">
              <label
                htmlFor="filterTaskType"
                className="text-sm font-semibold text-slate-700"
              >
                Filter by Task Type:
              </label>
              <select
                id="filterTaskType"
                value={filterTaskType}
                onChange={(e) => setFilterTaskType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-slate-700"
              >
                <option value="">All</option>
                {TASK_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <span className="text-sm text-slate-600">{filteredTasks.length} tasks</span>
            </div>
          </div
