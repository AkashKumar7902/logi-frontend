// src/components/Common/HomePage.js

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './HomePage.css'; // Optional: For custom styling

function HomePage() {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && userRole) {
      // Redirect based on the user's role
      switch (userRole) {
        case 'user':
          navigate('/user');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <h1>Welcome to Logi</h1>
        <p>Your Reliable On-Demand Logistics Platform</p>
      </header>

      <section className="homepage-content">
        <div className="homepage-section">
          <h2>For Users</h2>
          <p>
            Need to transport your goods quickly and efficiently? Logi connects you with a
            fleet of reliable drivers to ensure your items reach their destination safely.
          </p>
          <div className="homepage-buttons">
            <Link to="/register/user" className="btn btn-user">
              Register as User
            </Link>
            <Link to="/login/user" className="btn btn-user">
              Login as User
            </Link>
          </div>
        </div>

        <div className="homepage-section">
          <h2>For Drivers</h2>
          <p>
            Join our network of drivers and earn by transporting goods for users around the world.
            Enjoy flexible schedules and competitive pricing.
          </p>
          <div className="homepage-buttons">
            <Link to="/register/driver" className="btn btn-driver">
              Register as Driver
            </Link>
            <Link to="/login/driver" className="btn btn-driver">
              Login as Driver
            </Link>
          </div>
        </div>

        <div className="homepage-section">
          <h2>For Admins</h2>
          <p>
            Manage the entire logistics platform efficiently. Oversee drivers, vehicles, and bookings,
            and access comprehensive analytics.
          </p>
          <div className="homepage-buttons">
            <Link to="/login/admin" className="btn btn-admin">
              Login as Admin
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
