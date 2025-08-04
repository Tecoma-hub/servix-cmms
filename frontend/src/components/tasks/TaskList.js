// frontend/src/components/tasks/TaskList.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const TaskList = ({ equipmentId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Build query parameters
        let url = '/api/tasks';
        if (equipmentId) {
          url += `?equipmentId=${equipmentId}`;
        }
        
        const res = await api.get(url);
        setTasks(Array.isArray(res.data.tasks) ? res.data.tasks : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [equipmentId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <span className="ml-2 text-gray-600">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Priority: {task.priority}</span>
                  {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
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
                {task.equipmentId && (
                  <div className="mt-2 text-sm text-gray-600">
                    Equipment: {task.equipmentId.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;