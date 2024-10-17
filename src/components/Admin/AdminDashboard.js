// src/components/Admin/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

function AdminDashboard() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
    fetchAnalytics();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/admin/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Display drivers, vehicles, and analytics */}
    </div>
  );
}

export default AdminDashboard;
