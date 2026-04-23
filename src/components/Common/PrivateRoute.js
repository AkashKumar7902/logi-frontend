// src/components/Common/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function PrivateRoute({ children, role }) {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    // Redirect to the appropriate login page based on role
    return <Navigate to={`/login/${role}`} replace />;
  }
  if (role && userRole !== role) {
    // Optional: Redirect to a "Not Authorized" page or home
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;
