// src/components/Admin/AdminDashboard.js

import React, { useState } from 'react';
import GeneralTab from './GeneralTab';
import VehiclesTab from './VehiclesTab';
import DriversTab from './DriversTab';
import { FaTachometerAlt, FaTruck, FaUsers } from 'react-icons/fa';
import './AdminDashboard.css'; // Optional: For custom styling

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('general');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab />;
      case 'vehicles':
        return <VehiclesTab />;
      case 'drivers':
        return <DriversTab />;
      default:
        return <GeneralTab />;
    }
  };

  return (
    <div className="admin-dashboard-container flex h-screen">
      {/* Left Panel - Navigation */}
      <div className="w-1/4 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h2>
        <ul className="space-y-4">
          <li
            className={`flex items-center p-2 rounded cursor-pointer ${
              activeTab === 'general' ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('general')}
          >
            <FaTachometerAlt className="mr-2" />
            General
          </li>
          <li
            className={`flex items-center p-2 rounded cursor-pointer ${
              activeTab === 'vehicles' ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('vehicles')}
          >
            <FaTruck className="mr-2" />
            Vehicles
          </li>
          <li
            className={`flex items-center p-2 rounded cursor-pointer ${
              activeTab === 'drivers' ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('drivers')}
          >
            <FaUsers className="mr-2" />
            Drivers
          </li>
        </ul>
      </div>

      {/* Right Panel - Content */}
      <div className="w-3/4 p-6 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
