// frontend/src/components/routing/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ user, role, children }) => {
  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If role is specified and user doesn't have the required role, redirect to dashboard
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" />;
  }

  // If children are provided, render them, otherwise render the Outlet (for nested routes)
  return children || <Outlet />;
};

export default PrivateRoute;