// src/components/Admin/VehiclesTab.js

import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

const VehiclesTab = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vehicleType: '',
    driverID: '',
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/admin/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to fetch vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewVehicle({ ...newVehicle, [e.target.name]: e.target.value });
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/vehicles', newVehicle);
      toast.success('Vehicle added successfully.');
      setNewVehicle({
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        vehicleType: '',
        driverID: '',
      });
      setShowAddForm(false);
      fetchVehicles();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle.');
    }
  };

  const handleDeleteVehicle = async (vehicleID) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/admin/vehicles/${vehicleID}`);
      toast.success('Vehicle deleted successfully.');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle.');
    }
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetails(true);
  };

  if (loading) {
    return <p>Loading vehicles...</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Vehicles Management</h2>
      <button
        className="mb-4 bg-green-500 text-white px-4 py-2 rounded flex items-center"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        <FaPlus className="mr-2" />
        {showAddForm ? 'Close Form' : 'Add New Vehicle'}
      </button>

      {/* Add Vehicle Form */}
      {showAddForm && (
        <form onSubmit={handleAddVehicle} className="mb-6 bg-white p-4 shadow rounded">
          <h3 className="text-xl font-semibold mb-4">Add New Vehicle</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">Make</label>
              <input
                type="text"
                name="make"
                value={newVehicle.make}
                onChange={handleInputChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Model</label>
              <input
                type="text"
                name="model"
                value={newVehicle.model}
                onChange={handleInputChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Year</label>
              <input
                type="number"
                name="year"
                value={newVehicle.year}
                onChange={handleInputChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">License Plate</label>
              <input
                type="text"
                name="licensePlate"
                value={newVehicle.licensePlate}
                onChange={handleInputChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Vehicle Type</label>
              <select
                name="vehicleType"
                value={newVehicle.vehicleType}
                onChange={handleInputChange}
                required
                className="w-full border p-2 rounded"
              >
                <option value="">Select Type</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700">Assign Driver (Optional)</label>
              <input
                type="text"
                name="driverID"
                value={newVehicle.driverID}
                onChange={handleInputChange}
                placeholder="Driver ID"
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Add Vehicle
          </button>
        </form>
      )}

      {/* Vehicles List */}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Make</th>
            <th className="py-2 px-4 border-b">Model</th>
            <th className="py-2 px-4 border-b">Year</th>
            <th className="py-2 px-4 border-b">License Plate</th>
            <th className="py-2 px-4 border-b">Vehicle Type</th>
            <th className="py-2 px-4 border-b">Driver ID</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!vehicles ? (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No vehicles found.
              </td>
            </tr>
          ) : (
            vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td className="py-2 px-4 border-b">{vehicle.make}</td>
                <td className="py-2 px-4 border-b">{vehicle.model}</td>
                <td className="py-2 px-4 border-b">{vehicle.year}</td>
                <td className="py-2 px-4 border-b">{vehicle.licensePlate}</td>
                <td className="py-2 px-4 border-b">{vehicle.vehicleType}</td>
                <td className="py-2 px-4 border-b">
                  {vehicle.driverID ? vehicle.driverID : 'Unassigned'}
                </td>
                <td className="py-2 px-4 border-b flex space-x-2">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleViewDetails(vehicle)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Vehicle Details Modal */}
      {showDetails && selectedVehicle && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h3 className="text-xl font-semibold mb-4">Vehicle Details</h3>
            <p>
              <strong>Make:</strong> {selectedVehicle.make}
            </p>
            <p>
              <strong>Model:</strong> {selectedVehicle.model}
            </p>
            <p>
              <strong>Year:</strong> {selectedVehicle.year}
            </p>
            <p>
              <strong>License Plate:</strong> {selectedVehicle.licensePlate}
            </p>
            <p>
              <strong>Vehicle Type:</strong> {selectedVehicle.vehicleType}
            </p>
            <p>
              <strong>Driver ID:</strong>{' '}
              {selectedVehicle.driverID ? selectedVehicle.driverID : 'Unassigned'}
            </p>
            <button
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
              onClick={() => setShowDetails(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesTab;
