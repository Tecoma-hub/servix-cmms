// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext';

// Theme (for dark mode across app)
import { ThemeProvider } from './context/ThemeContext';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Equipment from './components/equipment/Equipment';
import Maintenance from './components/maintenance/Maintenance';
import SchedulePreventive from './components/maintenance/SchedulePreventive';
import ReportIssue from './components/maintenance/ReportIssue';
import Tasks from './components/tasks/Tasks';
import Users from './components/users/Users';
import AddEquipment from './components/equipment/AddEquipment';
import AddTask from './components/tasks/AddTask';
import AddUser from './components/users/AddUser';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PrivateRoute from './components/routing/PrivateRoute';

// NEW: Reports
import ReportsPage from './components/reports/ReportsPage';
// NEW: Settings page (with Dark Mode toggle, etc.)
import Settings from './components/settings/Settings';

// Axios base
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

// Interceptors
axios.interceptors.request.use(
  (request) => {
    const token = localStorage.getItem('token');
    if (token) request.headers['Authorization'] = `Bearer ${token}`;
    return request;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = (userData) => {
    if (userData?.token && userData?.user) {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData.user));
      setUser(userData.user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
          <p className="mt-4 text-gray-600 dark:text-slate-300">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
            {/* Desktop sidebar */}
            {user && (
              <div className="hidden md:block">
                <Sidebar currentPage={currentPage} />
              </div>
            )}

            {/* Mobile sidebar (slide-over) */}
            {user && (
              <>
                <div
                  className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
                    sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                />
                <div
                  className={`fixed z-50 top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform md:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  }`}
                >
                  <Sidebar currentPage={currentPage} onNavigate={() => setSidebarOpen(false)} />
                </div>
              </>
            )}

            <div className={user ? 'flex-1 flex flex-col overflow-hidden' : 'w-full'}>
              {/* Top bar: add hamburger for small screens */}
              {user && (
                <div className="sticky top-0 z-30">
                  <div className="md:hidden flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-3 py-2">
                    <button
                      onClick={() => setSidebarOpen((s) => !s)}
                      aria-label="Toggle menu"
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    {/* Keep your existing Navbar content to the right on mobile if needed */}
                    <div className="ml-2 flex-1">
                      <Navbar user={user} logout={logout} compact />
                    </div>
                  </div>

                  {/* Desktop navbar */}
                  <div className="hidden md:block">
                    <Navbar user={user} logout={logout} />
                  </div>
                </div>
              )}

              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <Routes>
                    {/* Public */}
                    <Route
                      path="/login"
                      element={!user ? <Login login={login} /> : <Navigate to="/dashboard" replace />}
                    />
                    <Route
                      path="/register"
                      element={!user ? <Register login={login} /> : <Navigate to="/dashboard" replace />}
                    />

                    {/* Default */}
                    <Route
                      path="/"
                      element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
                    />

                    {/* Protected */}
                    <Route
                      path="/dashboard"
                      element={
                        <PrivateRoute user={user}>
                          <Dashboard user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/equipment"
                      element={
                        <PrivateRoute user={user}>
                          <Equipment user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/add-equipment"
                      element={
                        <PrivateRoute user={user}>
                          <AddEquipment user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/maintenance"
                      element={
                        <PrivateRoute user={user}>
                          <Maintenance user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/schedule-preventive"
                      element={
                        <PrivateRoute user={user} role="Engineer">
                          <SchedulePreventive user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/report-issue"
                      element={
                        <PrivateRoute user={user}>
                          <ReportIssue user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/tasks"
                      element={
                        <PrivateRoute user={user}>
                          <Tasks user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/add-task"
                      element={
                        <PrivateRoute user={user}>
                          <AddTask user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <PrivateRoute user={user} role="Engineer">
                          <Users user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/add-user"
                      element={
                        <PrivateRoute user={user} role="Engineer">
                          <AddUser user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />

                    {/* Reports */}
                    <Route
                      path="/reports"
                      element={
                        <PrivateRoute user={user}>
                          <ReportsPage user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />

                    {/* Settings */}
                    <Route
                      path="/settings"
                      element={
                        <PrivateRoute user={user}>
                          <Settings user={user} setCurrentPage={setCurrentPage} />
                        </PrivateRoute>
                      }
                    />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
                  </Routes>
                </div>
              </main>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
