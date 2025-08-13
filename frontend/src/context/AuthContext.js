// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in (on component mount)
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Set the authorization header for all API requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data from the server
          const response = await api.get('/auth/me');
          
          // Set user data and authentication state
          setUser(response.data.user);
          setIsAuthenticated(true);
          setError('');
        } catch (error) {
          // If token is invalid or expired, remove it and reset state
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
          setError('Session expired. Please log in again.');
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function - request OTP
  const requestOTP = async (serviceNumber) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/auth/request-otp', { serviceNumber });
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and login
  const verifyOTP = async (serviceNumber, otp) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/auth/verify-otp', { serviceNumber, otp });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Set user data and authentication state
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
    
    // Reset user state
    setUser(null);
    setIsAuthenticated(false);
    setError('');
  };

  // Clear error
  const clearError = () => {
    setError('');
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!user || !user.role) return false;
    
    // Convert role to proper case (Engineer, Admin, Technician)
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    return user.role === normalizedRole;
  };

  // Check if user is admin or engineer (full access)
  const hasFullAccess = () => {
    return hasRole('Admin') || hasRole('Engineer');
  };

  // Value object to be provided to consumers
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    requestOTP,
    verifyOTP,
    logout,
    clearError,
    hasRole,
    hasFullAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};