// frontend/src/components/layout/Sidebar.js
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Home, Box, Wrench, ListTodo, Users, Settings, BarChart2, FileText } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const currentPage = location.pathname.split('/')[1] || 'dashboard';

  // Live user from API (fixes stale localStorage issue)
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // fallback to localStorage user object if present
          const fallback = JSON.parse(localStorage.getItem('user') || 'null');
          setUser(fallback);
          return;
        }
        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data?.user || null);
        // keep localStorage in sync so other parts using it don't break
        if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user));
      } catch (err) {
        // graceful fallback
        const fallback = JSON.parse(localStorage.getItem('user') || 'null');
        setUser(fallback);
      }
    };
    fetchMe();
  }, []);

  // Define navigation items
  const navItems = [
    { path: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { path: 'equipment', label: 'Equipment', icon: Box },
    { path: 'maintenance', label: 'Maintenance', icon: Wrench },
    { path: 'tasks', label: 'Tasks', icon: ListTodo },
    { path: 'users', label: 'Users', icon: Users },
    { path: 'reports', label: 'Reports', icon: FileText },
    { path: 'settings', label: 'Settings', icon: Settings }
  ];

  const initial = (user?.name?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="bg-white text-slate-800 w-64 min-h-screen border-r border-slate-200 shadow-lg flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Servix CMMS</h1>
            <p className="text-sm text-slate-500">Maintenance System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={`/${item.path}`}
                  className={`flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-green-500 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile (now shows correct logged-in user) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.role || 'Staff'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
