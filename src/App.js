// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UserRegister from './components/Auth/UserRegister';
import UserLogin from './components/Auth/UserLogin';
import DriverRegister from './components/Auth/DriverRegister';
import DriverLogin from './components/Auth/DriverLogin';
import AdminLogin from './components/Auth/AdminLogin';
import UserDashboard from './components/User/UserDashboard';
import DriverDashboard from './components/Driver/DriverDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import PrivateRoute from './components/Common/PrivateRoute';
import HomePage from './components/Common/HomePage';
import Navbar from './components/Common/Navbar';
import { useAuth } from './contexts/AuthContext';
import useWebSocket from './hooks/useWebSocket';

function App() {
  const { authToken, isAuthenticated, userRole } = useAuth();

  const wsUrl = 'ws://logi-y295.onrender.com/ws?token=' + authToken; // Replace with dynamic token as needed
  const isConnected = useWebSocket(wsUrl);

  return (
    <Router>
      <Navbar /> {/* Optional: Include a Navbar */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register/user" element={<UserRegister />} />
        <Route path="/login/user" element={<UserLogin />} />
        <Route path="/register/driver" element={<DriverRegister />} />
        <Route path="/login/driver" element={<DriverLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />

        {/* Protected Routes */}
        <Route
          path="/user/*"
          element={
            <PrivateRoute role="user">
              <UserDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/driver/*"
          element={
            <PrivateRoute role="driver">
              <DriverDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
