// src/components/Admin/DriversTab.js

import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { FaTrash, FaInfoCircle } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { receiveMessage, clearMessages } from "../../slices/websocketSlice";

const DriversTab = () => {
  const dispatch = useDispatch();
  const websocketMessages = useSelector((state) => state.websocket.messages);

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [assignDriver, setAssignDriver] = useState({
    driverID: "",
    vehicleID: "",
  });

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (websocketMessages.length > 0) {
      websocketMessages.forEach((msg) => {
        if (msg.type === "driver_status_update") {
          const { driver_id, status } = msg.payload;
          updateDriverStatus(driver_id, status);
        }
        // Handle other message types if needed
      });
      // Clear messages after processing
      dispatch(clearMessages());
    }
    // eslint-disable-next-line
  }, [websocketMessages]);

  const fetchDrivers = async () => {
    try {
      const response = await api.get("/admin/drivers");
      setDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast.error("Failed to fetch drivers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/admin/vehicles");
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to fetch vehicles.");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const { driverID, vehicleID } = assignDriver;

    if (!driverID || !vehicleID) {
      toast.error("Please select both driver and vehicle.");
      return;
    }

    try {
      // Assign driver to vehicle
      await api.put(`/admin/drivers/${driverID}`, { vehicleID });
      await api.put(`/admin/vehicles/${vehicleID}`, { driverID });

      toast.success("Driver assigned to vehicle successfully.");
      setAssignDriver({ driverID: "", vehicleID: "" });
      fetchDrivers();
      fetchVehicles();
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast.error("Failed to assign driver to vehicle.");
    }
  };

  const handleViewDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDetails(true);
  };

  const calculatePerformanceScore = (driver) => {
    const {
      total_bookings_count,
      accepted_bookings_count,
      completed_bookings_count,
    } = driver;
    if (total_bookings_count === 0) return "0.00";
    const acceptanceRate =
      (accepted_bookings_count / total_bookings_count) * 100;
    const completionRate =
      accepted_bookings_count === 0
        ? 0
        : (completed_bookings_count / accepted_bookings_count) * 100;
    const performanceScore = ((acceptanceRate + completionRate) / 2).toFixed(2);
    return performanceScore;
  };

  const updateDriverStatus = (driverID, newStatus) => {
    setDrivers((prevDrivers) =>
      prevDrivers.map((driver) =>
        driver.id === driverID ? { ...driver, status: newStatus } : driver
      )
    );
    toast.info(`Driver ${driverID} status updated to ${newStatus}.`);
  };

  if (loading) {
    return <p>Loading drivers...</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Drivers Management</h2>

      {/* Assign Driver to Vehicle Form */}
      <form onSubmit={handleAssign} className="mb-6 bg-white p-4 shadow rounded">
        <h3 className="text-xl font-semibold mb-4">Assign Driver to Vehicle</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700">Select Driver</label>
            {drivers && (
              <select
                name="driverID"
                value={assignDriver.driverID}
                onChange={(e) =>
                  setAssignDriver({ ...assignDriver, driverID: e.target.value })
                }
                required
                className="w-full border p-2 rounded"
              >
                <option value="">Select Driver</option>
                {drivers
                  .filter((driver) => !driver.vehicleID) // Only available drivers
                  .map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} (Email: {driver.email})
                    </option>
                  ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Select Vehicle</label>
            {vehicles && (
              <select
                name="vehicleID"
                value={assignDriver.vehicleID}
                onChange={(e) =>
                  setAssignDriver({ ...assignDriver, vehicleID: e.target.value })
                }
                required
                className="w-full border p-2 rounded"
              >
                <option value="">Select Vehicle</option>
                {vehicles
                  .filter((vehicle) => !vehicle.driverID) // Only available vehicles
                  .map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.vehicle_type})
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Assign
        </button>
      </form>

      {/* Drivers List */}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Vehicle ID</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Completed Bookings</th>
            <th className="py-2 px-4 border-b">Performance Score</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No drivers found.
              </td>
            </tr>
          ) : (
            drivers.map((driver) => (
              <tr key={driver.id}>
                <td className="py-2 px-4 border-b">{driver.name}</td>
                <td className="py-2 px-4 border-b">{driver.email}</td>
                <td className="py-2 px-4 border-b">
                  {driver.vehicleID ? driver.vehicleID : "Unassigned"}
                </td>
                <td className="py-2 px-4 border-b">
                  <span
                    className={`px-2 py-1 rounded-full text-white ${
                      driver.status === "Available"
                        ? "bg-green-500"
                        : driver.status === "Busy"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  >
                    {driver.status}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  {driver.completed_bookings_count}
                </td>
                <td className="py-2 px-4 border-b">
                  {calculatePerformanceScore(driver)}%
                </td>
                <td className="py-2 px-4 border-b flex space-x-2">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleViewDetails(driver)}
                  >
                    <FaInfoCircle />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to remove this driver?"
                        )
                      ) {
                        // Implement driver deletion if needed
                        toast.info("Driver removal not implemented.");
                      }
                    }}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Driver Details Modal */}
      {showDetails && selectedDriver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h3 className="text-xl font-semibold mb-4">Driver Details</h3>
            <p>
              <strong>Name:</strong> {selectedDriver.name}
            </p>
            <p>
              <strong>Email:</strong> {selectedDriver.email}
            </p>
            <p>
              <strong>Vehicle ID:</strong>{" "}
              {selectedDriver.vehicleID ? selectedDriver.vehicleID : "Unassigned"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded-full text-white ${
                  selectedDriver.status === "Available"
                    ? "bg-green-500"
                    : selectedDriver.status === "Busy"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              >
                {selectedDriver.status}
              </span>
            </p>
            <p>
              <strong>Total Bookings:</strong> {selectedDriver.total_bookings_count}
            </p>
            <p>
              <strong>Accepted Bookings:</strong> {selectedDriver.accepted_bookings_count}
            </p>
            <p>
              <strong>Completed Bookings:</strong>{" "}
              {selectedDriver.completed_bookings_count}
            </p>
            <p>
              <strong>Performance Score:</strong>{" "}
              {calculatePerformanceScore(selectedDriver)}%
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

export default DriversTab;
