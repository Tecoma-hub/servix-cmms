import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Equipment from './components/equipment/Equipment';
import Maintenance from './components/maintenance/Maintenance';
import Tasks from './components/tasks/Tasks';
import Users from './components/users/Users';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PrivateRoute from './components/routing/PrivateRoute';

// Set base URL for axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Check for token on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const res = await axios.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem('token');
    }
  };

  const login = (userData) => {
    setUser(userData.user);
    localStorage.setItem('token', userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {user && <Sidebar currentPage={currentPage} />}
        
        <div className={user ? "flex-1 flex flex-col overflow-hidden" : "w-full"}>
          {user && <Navbar user={user} logout={logout} />}
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-6 py-8">
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    !user ? <Login login={login} /> : <Dashboard user={user} />
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    !user ? <Register login={login} /> : <Dashboard user={user} />
                  } 
                />
                <Route 
                  path="/" 
                  element={
                    user ? <Dashboard user={user} /> : <Login login={login} />
                  } 
                />
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
                  path="/maintenance" 
                  element={
                    <PrivateRoute user={user}>
                      <Maintenance user={user} setCurrentPage={setCurrentPage} />
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
                  path="/users" 
                  element={
                    <PrivateRoute user={user} role="Engineer">
                      <Users user={user} setCurrentPage={setCurrentPage} />
                    </PrivateRoute>
                  } 
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