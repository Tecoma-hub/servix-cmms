// frontend/src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user, setCurrentPage }) => {
  const [counts, setCounts] = useState({
    equipment: 0,
    maintenance: 0,
    tasks: 0,
    users: 0
  });
  const [ongoingTasks, setOngoingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set current page
  useEffect(() => {
    if (setCurrentPage && typeof setCurrentPage === 'function') {
      setCurrentPage('dashboard');
    }
  }, [setCurrentPage]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [equipmentRes, maintenanceRes, tasksRes, usersRes] = await Promise.all([
          axios.get('/equipment'),
          axios.get('/maintenance'),
          axios.get('/tasks'),
          axios.get('/users')
        ]);

        setCounts({
          equipment: equipmentRes.data.count || equipmentRes.data.data?.length || 0,
          maintenance: maintenanceRes.data.count || maintenanceRes.data.data?.length || 0,
          tasks: tasksRes.data.count || tasksRes.data.data?.length || 0,
          users: usersRes.data.count || usersRes.data.data?.length || 0
        });

        // Filter ongoing tasks (Pending and In Progress)
        const allTasks = Array.isArray(tasksRes.data.tasks) ? tasksRes.data.tasks : [];
        const ongoing = allTasks.filter(task => 
          task.status === 'Pending' || task.status === 'In Progress'
        ).slice(0, 5); // Get first 5 ongoing tasks

        setOngoingTasks(ongoing);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/equipment" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900">Equipment</h3>
          <p className="text-2xl font-bold text-teal-600">{counts.equipment}</p>
        </Link>
        
        <Link to="/maintenance" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance</h3>
          <p className="text-2xl font-bold text-teal-600">{counts.maintenance}</p>
        </Link>
        
        <Link to="/tasks" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          <p className="text-2xl font-bold text-teal-600">{counts.tasks}</p>
        </Link>
        
        <Link to="/users" className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          <p className="text-2xl font-bold text-teal-600">{counts.users}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Equipment</h3>
            <Link to="/add-equipment" className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700 transition-colors">
              + Add
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
            </div>
          ) : counts.equipment === 0 ? (
            <p className="text-gray-600">No equipment found</p>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">You have {counts.equipment} equipment items</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ongoing Tasks</h3>
            <Link to="/add-task" className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700 transition-colors">
              + Assign
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
            </div>
          ) : ongoingTasks.length === 0 ? (
            <p className="text-gray-600">No ongoing tasks</p>
          ) : (
            <div className="space-y-3">
              {ongoingTasks.map(task => (
                <div key={task._id} className="border-b border-gray-200 pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">{task.title}</span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Due: {new Date(task.deadline).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default Dashboard;