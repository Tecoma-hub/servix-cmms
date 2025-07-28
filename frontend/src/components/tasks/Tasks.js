// frontend/src/components/tasks/Tasks.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Tasks = ({ user, setCurrentPage }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set current page
  useEffect(() => {
    if (setCurrentPage && typeof setCurrentPage === 'function') {
      setCurrentPage('tasks');
    }
  }, [setCurrentPage]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get('/tasks');
        // Ensure data.tasks exists and is an array
        setTasks(Array.isArray(res.data.tasks) ? res.data.tasks : []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
        setTasks([]); // Set to empty array on error
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <Link to="/add-task" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          + Assign Task
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No tasks found.</p>
        </div>
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map(task => (
                <tr key={task._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{task.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{task.assignedTo?.name || 'Unassigned'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(task.deadline).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Tasks;