// frontend/src/components/tasks/Tasks.js
import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import AddTaskModal from './AddTaskModal';
import api from '../../utils/api'; // Add missing import

const Tasks = () => {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError('');
        
        const res = await api.get('/api/tasks');
        setTasks(Array.isArray(res.data.tasks) ? res.data.tasks : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setShowAddTaskModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Tasks Management</h1>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + Add Task
          </button>
        </div>

        <TaskList />

        {showAddTaskModal && (
          <AddTaskModal 
            onClose={() => setShowAddTaskModal(false)} 
            onTaskCreated={handleTaskCreated}
          />
        )}
      </div>
    </div>
  );
};

export default Tasks;