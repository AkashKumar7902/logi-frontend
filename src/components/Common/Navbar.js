// src/components/Common/Navbar.js

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css'; // Optional: For custom styling

function Navbar() {
  const { isAuthenticated, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <nav className="navbar">
      <h2 className="navbar-brand">
        <Link to="/">Logi</Link>
      </h2>
      <ul className="navbar-links">
        {isAuthenticated ? (
          <>
            {/* Show dashboard link based on role */}
            {userRole === 'user' && (
              <li>
                <Link to="/user">User Dashboard</Link>
              </li>
            )}
            {userRole === 'driver' && (
              <li>
                <Link to="/driver">Driver Dashboard</Link>
              </li>
            )}
            {userRole === 'admin' && (
              <li>
                <Link to="/admin">Admin Dashboard</Link>
              </li>
            )}
            {/* Logout option */}
            <li>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            {/* Show login and register options when not authenticated */}
            <li>
              <Link to="/register/user">User Register</Link>
            </li>
            <li>
              <Link to="/login/user">User Login</Link>
            </li>
            <li>
              <Link to="/register/driver">Driver Register</Link>
            </li>
            <li>
              <Link to="/login/driver">Driver Login</Link>
            </li>
            <li>
              <Link to="/login/admin">Admin Login</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
