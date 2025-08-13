// frontend/src/components/routing/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, user, role }) => {
  const location = useLocation();

  // If no user is logged in, redirect to login with the current path saved
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If role-based restriction exists
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, render the protected component
  return children;
};

export default PrivateRoute;
