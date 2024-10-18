// src/components/Admin/GeneralTab.js

import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const GeneralTab = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to fetch statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading statistics...</p>;
  }

  if (!statistics) {
    return <p>No statistics available.</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Administrative Statistics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-xl font-semibold">Average Trip Time</h3>
          <p className="text-gray-700">{Math.round(statistics.average_trip_time * 100) / 100} minutes</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-xl font-semibold">Total Bookings</h3>
          <p className="text-gray-700">{statistics.total_bookings}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-xl font-semibold">Total Drivers</h3>
          <p className="text-gray-700">{statistics.total_drivers}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-xl font-semibold">Total Users</h3>
          <p className="text-gray-700">{statistics.total_users}</p>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
