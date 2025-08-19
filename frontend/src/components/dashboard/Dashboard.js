// frontend/src/components/dashboard/Dashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import socket from '../../utils/socket'; // <- your Socket.IO client
import GenerateReportModal from '../reports/GenerateReportModal'; // <-- ADDED

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false); // <-- ADDED

  // --- Load current user (fixes stale name/role everywhere) ---
  const fetchUser = async () => {
    try {
      setUserLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setCurrentUser(JSON.parse(localStorage.getItem('user') || 'null'));
        return;
      }
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data?.user || null);
      if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch {
      setCurrentUser(JSON.parse(localStorage.getItem('user') || 'null'));
    } finally {
      setUserLoading(false);
    }
  };

  // --- Load dashboard metrics ---
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(res.data.dashboard);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchDashboardData();
  }, []);

  // --- Real-time refresh on equipment/tasks events ---
  useEffect(() => {
    const refetch = () => fetchDashboardData();
    socket.on('equipment:updated', refetch);
    socket.on('equipment:deleted', refetch);
    socket.on('task:created', refetch);
    socket.on('task:updated', refetch);
    socket.on('task:completed', refetch);
    socket.on('task:deleted', refetch);
    return () => {
      socket.off('equipment:updated', refetch);
      socket.off('equipment:deleted', refetch);
      socket.off('task:created', refetch);
      socket.off('task:updated', refetch);
      socket.off('task:completed', refetch);
      socket.off('task:deleted', refetch);
    };
  }, []);

  // ---- Helpers ----
  const totalEquipment = dashboardData?.equipment?.total || 0;
  const pct = (count) =>
    !totalEquipment ? 0 : Math.min(100, Math.round((count / totalEquipment) * 100));

  const bars = useMemo(() => {
    const eq = dashboardData?.equipment || {};
    return [
      { status: 'Serviceable',       count: eq.serviceable || 0,   percentage: pct(eq.serviceable || 0),   color: 'bg-green-500' },
      { status: 'Under Maintenance', count: eq.maintenance || 0,   percentage: pct(eq.maintenance || 0),   color: 'bg-yellow-500' },
      { status: 'Unserviceable',     count: eq.unserviceable || 0, percentage: pct(eq.unserviceable || 0), color: 'bg-red-500' }
    ];
  }, [dashboardData, totalEquipment]);

  const recentTasks = (dashboardData?.recentTasks || []).slice(0, 4);
  const fmtDate = (d) => {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString();
  };

  // --- UI bits ---
  const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color.replace('text-', 'from-')}50 ${color.replace('text-', 'to-')}100`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center">
            <svg className={`w-4 h-4 mr-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d={
                  trend === 'up'
                    ? 'M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z'
                    : 'M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z'
                }
                clipRule="evenodd"
              />
            </svg>
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trendValue}% from last month
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const QuickAction = ({ icon, label, onClick, color }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border ${color} hover:bg-opacity-10`}
    >
      {icon}
      <span className="mt-2 text-sm font-medium text-slate-700">{label}</span>
    </button>
  );

  // --- Loading / Error states ---
  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
          <p className="mt-3 text-slate-600">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* ===== Statistics Cards ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Equipment"
            value={dashboardData?.equipment?.total || 0}
            color="text-blue-600"
            trend="up"
            trendValue="12"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            }
          />
          <StatCard
            title="Serviceable"
            value={dashboardData?.equipment?.serviceable || 0}
            color="text-green-600"
            trend="up"
            trendValue="8"
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Under Maintenance"
            value={dashboardData?.equipment?.maintenance || 0}
            color="text-yellow-600"
            trend="down"
            trendValue="3"
            icon={
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            title="Unserviceable"
            value={dashboardData?.equipment?.unserviceable || 0}
            color="text-red-600"
            trend="up"
            trendValue="2"
            icon={
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* ===== Quick Actions ===== */}
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <QuickAction
            icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
            label="Add Equipment"
            onClick={() => (window.location.href = '/add-equipment')}
            color="border-blue-100"
          />
          <QuickAction
            icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8" /></svg>}
            label="View Inventory"
            onClick={() => (window.location.href = '/equipment')}
            color="border-green-100"
          />
          <QuickAction
            icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7" /></svg>}
            label="Generate Report"
            onClick={() => setShowReportModal(true)} // <-- OPEN MODAL
            color="border-purple-100"
          />
          <QuickAction
            icon={<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" /></svg>}
            label="Maintenance Tasks"
            onClick={() => (window.location.href = '/tasks')}
            color="border-orange-100"
          />
        </div>

        {/* ===== Main Content ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equipment Status + Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Equipment Status Overview</h2>

              <div className="space-y-4">
                {bars.map((item) => (
                  <div key={item.status} className="flex items-center">
                    <div className="w-40 text-sm font-medium text-slate-700">{item.status}</div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-slate-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${item.color} transition-all duration-500 ease-out`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-sm text-slate-600 text-right">{item.count}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Recent Activity</h3>

                {recentTasks.length === 0 ? (
                  <div className="text-slate-500 text-sm">No recent activity.</div>
                ) : (
                  <div className="space-y-3">
                    {recentTasks.map((t) => (
                      <div key={t._id} className="flex items-center p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {t.title || 'Task'} ({t.status})
                          </p>
                          <p className="text-xs text-slate-500">
                            {t.equipment?.name ? `Equip: ${t.equipment.name}` : 'No equipment'} •{' '}
                            {t.assignedTo?.name ? `Tech: ${t.assignedTo.name}` : 'No tech'} • {fmtDate(t.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: User card + Tasks summary + System status */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                  {(currentUser?.name?.charAt(0) || 'U').toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{currentUser?.name || 'User'}</h3>
                <p className="text-slate-600">{currentUser?.role || 'Staff'}</p>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Role:</span>
                    <span className="font-medium">{currentUser?.role || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-600">Department:</span>
                    <span className="font-medium">{currentUser?.department || 'BMED'}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-600">Last Login:</span>
                    <span className="font-medium">Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Tasks Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Tasks</span>
                  <span className="font-semibold text-blue-600">{dashboardData?.tasks?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-semibold text-yellow-600">{dashboardData?.tasks?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">In Progress</span>
                  <span className="font-semibold text-blue-600">{dashboardData?.tasks?.inProgress || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Completed</span>
                  <span className="font-semibold text-green-600">{dashboardData?.tasks?.completed || 0}</span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-slate-700">Database Connected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-slate-700">API Service Running</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-slate-700">Backup System Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative blobs (keep your style) */}
        <div className="absolute top-20 -left-10 w-50 h-50 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 -right-10 w-50 h-50 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* ==== Generate Report Modal ==== */}
      <GenerateReportModal open={showReportModal} onClose={() => setShowReportModal(false)} />
    </div>
  );
};

export default Dashboard;
