// frontend/src/components/tasks/AssignTaskPage.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AssignTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch all tasks and users
        const [tasksRes, usersRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/users')
        ]);
        
        setTasks(tasksRes.data.tasks || []);
        // Filter users to show only technicians
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

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedTask || !selectedUser) {
      setError('Please select both a task and a technician');
      return;
    }

    try {
      setAssignLoading(true);
      setError('');
      
      // Assign the task to the selected user
      await api.put(`/tasks/${selectedTask}/assign`, {
        assignedTo: selectedUser
      });
      
      // Update local state to reflect the assignment
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === selectedTask 
            ? { ...task, assignedTo: users.find(u => u._id === selectedUser) }
            : task
        )
      );
      
      // Reset selection
      setSelectedTask('');
      setSelectedUser('');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task');
    } finally {
      setAssignLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded max-w-md text-center">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assign Tasks</h1>
        </div>

        {/* Assignment Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Assign Task to Technician</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-800 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleAssignTask} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Task
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a task</option>
                  {tasks.map(task => (
                    <option key={task._id} value={task._id}>
                      {task.title} - {task.equipmentId?.name || 'Unknown Equipment'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Technician
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a technician</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={assignLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignLoading ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </form>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Tasks</h2>
          </div>
          <div className="p-6">
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tasks found</p>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Priority: {task.priority}</span>
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Equipment: {task.equipmentId?.name || 'Unknown'}
                    </div>
                    {task.assignedTo ? (
                      <div className="mt-2 text-sm text-gray-600">
                        Assigned to: {task.assignedTo.name}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-500">
                        Not assigned
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskPage;