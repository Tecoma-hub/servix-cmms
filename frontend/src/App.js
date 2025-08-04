// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

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

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

// Add request interceptor for debugging
axios.interceptors.request.use(
  request => {
    console.log('Request URL:', request.url);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add Authorization header if token exists
    if (token) {
      request.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return request;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.error('Axios Error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear auth data if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Check for token on load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Set the authorization header for this request
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };
          
          // Verify token and get user data
          const res = await axios.get('/auth/me', config);
          
          if (res.data && res.data.user) {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Auth verification error:', err);
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    console.log('Login function called with:', userData);
    
    if (userData && userData.token && userData.user) {
      // Store token in localStorage
      localStorage.setItem('token', userData.token);
      
      // Set user state
      setUser(userData.user);
      
      // Set default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
  };

  const logout = () => {
    // Clear user data
    setUser(null);
    
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Redirect to login
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {user && <Sidebar currentPage={currentPage} />}
        
        <div className={user ? "flex-1 flex flex-col overflow-hidden" : "w-full"}>
          {user && <Navbar user={user} logout={logout} />}
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-6 py-8">
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/login" 
                  element={
                    !user ? <Login login={login} /> : <Navigate to="/dashboard" replace />
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    !user ? <Register login={login} /> : <Navigate to="/dashboard" replace />
                  } 
                />
                
                {/* Default route */}
                <Route 
                  path="/" 
                  element={
                    user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
                  } 
                />
                
                {/* Protected routes */}
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
                
                {/* Catch all unmatched routes */}
                <Route 
                  path="*" 
                  element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;