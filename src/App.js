import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/Common/PrivateRoute';
import Navbar from './components/Common/Navbar';
import { useAuth } from './contexts/AuthContext';
import useWebSocket from './hooks/useWebSocket';
import { wsBaseURL } from './config';

const HomePage = lazy(() => import('./components/Common/HomePage'));
const UserRegister = lazy(() => import('./components/Auth/UserRegister'));
const UserLogin = lazy(() => import('./components/Auth/UserLogin'));
const DriverRegister = lazy(() => import('./components/Auth/DriverRegister'));
const DriverLogin = lazy(() => import('./components/Auth/DriverLogin'));
const AdminLogin = lazy(() => import('./components/Auth/AdminLogin'));
const UserDashboard = lazy(() => import('./components/User/UserDashboard'));
const DriverDashboard = lazy(() => import('./components/Driver/DriverDashboard'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));

function App() {
  const { authToken } = useAuth();

  const wsUrl = authToken
    ? `${wsBaseURL}/ws?token=${encodeURIComponent(authToken)}`
    : null;
  useWebSocket(wsUrl);

  return (
    <Router>
      <Navbar />
      <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register/user" element={<UserRegister />} />
          <Route path="/login/user" element={<UserLogin />} />
          <Route path="/register/driver" element={<DriverRegister />} />
          <Route path="/login/driver" element={<DriverLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />

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

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
