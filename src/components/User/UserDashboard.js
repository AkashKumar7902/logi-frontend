// src/components/User/UserDashboard.js

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../services/api";
import MapView from "../Map/MapView";
import { clearMessages } from "../../slices/websocketSlice";
import routingService from "../../services/routingService"; // <-- Import added here
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AutocompleteSearch from "../Map/AutocompleteSearch";

const UserDashboard = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.websocket.messages);
  const [activeBooking, setActiveBooking] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    pickupLatitude: "",
    pickupLongitude: "",
    dropoffLatitude: "",
    dropoffLongitude: "",
    vehicleType: "car",
    scheduledTime: "",
  });
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);

  // Fetch active booking on component mount
  useEffect(() => {
    fetchActiveBooking();
    getUserCurrentLocation();
    // eslint-disable-next-line
  }, []);

  // Listen to WebSocket messages
  useEffect(() => {
    if (messages.length === 0) return;

    messages.forEach((msg) => {
      if (msg.type === "status_update") {
        if (msg.booking_id === activeBooking?.id) {
          setBookingStatus(msg.status);
          toast.info(`Booking Status Updated: ${msg.status}`);
          if (msg.status === "In Transit") {
            // Update drop-off location if necessary
            setDropoffLocation(activeBooking.dropoff_location);
            // Route from driver to drop-off
            fetchRoute(driverLocation, activeBooking.dropoff_location);
          }
        }
      }
      if (msg.type === "driver_location") {
        if (msg.booking_id === activeBooking?.id) {
          setDriverLocation({
            latitude: msg.latitude,
            longitude: msg.longitude,
          });
          // Update route based on booking status
          if (bookingStatus === "Driver Assigned") {
            fetchRoute(userLocation, {
              latitude: msg.latitude,
              longitude: msg.longitude,
            });
          } else if (bookingStatus === "In Transit") {
            fetchRoute(
              { latitude: msg.latitude, longitude: msg.longitude },
              dropoffLocation
            );
          }
        }
      }
    });
    // Clear messages after processing to prevent duplicate handling
    dispatch(clearMessages());
    // eslint-disable-next-line
  }, [messages]);

  const fetchActiveBooking = async () => {
    setLoading(true);
    try {
      const response = await api.get("/active-booking");
      console.log(response.data);
      if (response.data) {
        setActiveBooking(response.data);
        fetchDriverDetails(response.data.driver_id);
        setBookingStatus(response.data.status);
        setDropoffLocation({
          latitude: response.data.dropoff_location?.coordinates[1],
          longitude: response.data.dropoff_location?.coordinates[0],
        });
        // Fetch route based on booking status
        if (
          response.data.status === "Driver Assigned" ||
          response.data.status === "En Route to Pickup"
        ) {
          fetchRoute(userLocation, {
            latitude: response.data.driver_location.coordinates[1],
            longitude: response.data.driver_location.coordinates[0],
          });
        }
      }
    } catch (error) {
      console.error("Error fetching active booking:", error);
      setError(error?.response?.data?.error);
      toast.error(error?.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverDetails = async (driverId) => {
    try {
      const response = await api.get(`/drivers/${driverId}`);
      if (response.data) {
        setDriverDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching driver details:", error);
      setError(error?.response?.data?.error);
      toast.error(error?.response?.data?.error);
    }
  };

  const getUserCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("position ", position);
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          // If there's an active booking, fetch the route
          if (activeBooking) {
            if (
              activeBooking.status === "Driver Assigned" ||
              activeBooking.status === "En Route to Pickup"
            ) {
              fetchRoute(position.coords, {
                latitude: activeBooking.driver_location.coordinates[0],
                longitude: activeBooking.driver_location.coordinates[1],
              });
            }
            if (
              activeBooking.status === "Goods Collected" ||
              activeBooking.status === "In Transit"
            ) {
              fetchRoute(
                {
                  latitude: activeBooking.driver_location.coordinates[0],
                  longitude: activeBooking.driver_location.coordinates[1],
                },
                {
                  latitude: activeBooking.dropoff_location.coordinates[0],
                  longitude: activeBooking.dropoff_location.coordinates[1],
                }
              );
            }
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          setError("Error getting user location");
          toast.error("Error getting user location");
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setError("Geolocation is not supported by this browser.");
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Update handleBookingSubmit to use selected locations
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!pickup || !dropoff) {
      setError("Please select both pickup and drop-off locations.");
      toast.error("Please select both pickup and drop-off locations.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const bookingRequest = {
        pickup_location: {
          type: "Point",
          coordinates: [
            parseFloat(pickup.latitude),
            parseFloat(pickup.longitude),
          ],
        },
        dropoff_location: {
          type: "Point",
          coordinates: [
            parseFloat(dropoff.latitude),
            parseFloat(dropoff.longitude),
          ],
        },
        vehicle_type: formData.vehicleType,
        scheduled_time: formData.scheduledTime
          ? new Date(formData.scheduledTime).toISOString()
          : null,
      };

      const response = await api.post("/bookings", bookingRequest);
      if (response.data) {
        setActiveBooking(response.data);
        fetchDriverDetails(response.data.driver_id);
        setBookingStatus(response.data.status);
        setDriverLocation({
          latitude: response.data.driver_location?.coordinates[1],
          longitude: response.data.driver_location?.coordinates[0],
        });
        setDropoffLocation({
          latitude: response.data.dropoff_location?.coordinates[1],
          longitude: response.data.dropoff_location?.coordinates[0],
        });
        // Fetch route based on booking status
        if (response.data.status === "Driver Assigned") {
          fetchRoute(userLocation, {
            latitude: response.data.driver_location.coordinates[1],
            longitude: response.data.driver_location.coordinates[0],
          });
        }
        setShowBookingForm(false);
        toast.success("Booking created successfully.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setError(error?.response?.data?.error);
      toast.error(error?.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceEstimate = async () => {
    setLoading(true);
    setError(null);
    try {
      const estimateRequest = {
        pickup_location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.pickupLongitude),
            parseFloat(formData.pickupLatitude),
          ],
        },
        dropoff_location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.dropoffLongitude),
            parseFloat(formData.dropoffLatitude),
          ],
        },
        vehicle_type: formData.vehicleType,
      };

      const response = await api.post("/bookings/estimate", estimateRequest);
      if (response.data) {
        setPriceEstimate(response.data.estimated_price);
        toast.info(`Price Estimate: ₹${response.data.estimated_price}`);
      }
    } catch (error) {
      console.error("Error getting price estimate:", error);
      setError(error?.response?.data?.error);
      toast.error(error?.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoute = async (start, end) => {
    if (!start || !end) return;
    const startCoords = {
      latitude: parseFloat(start.latitude),
      longitude: parseFloat(start.longitude),
    };
    const endCoords = {
      latitude: parseFloat(end.latitude),
      longitude: parseFloat(end.longitude),
    };
    const route = await routingService.getRoute(startCoords, endCoords);
    if (route) {
      // The MapView component will fetch the route based on props
      // This function can be omitted if MapView handles route fetching internally
    } else {
      toast.error("Failed to fetch route.");
    }
  };

  // Handle selection from AutocompleteSearch
  const handlePickupSelect = (location) => {
    setFormData({
      ...formData,
      pickupLongitude: location?.longitude,
      pickupLatitude: location?.latitude,
    });
    setPickup(location);
  };

  const handleDropoffSelect = (location) => {
    setFormData({
      ...formData,
      dropoffLongitude: location?.longitude,
      dropoffLatitude: location?.latitude,
    });
    setDropoff(location);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ToastContainer />
      {/* Left Column */}
      <div className="md:w-1/3 bg-gray-100 p-6 overflow-auto">
        {loading && <p className="text-blue-500">Loading...</p>}
        {
          /* {activeBooking ? ( */ false ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">Active Booking</h2>
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Booking Details</h3>
                <p>
                  <strong>Pickup Location:</strong> Latitude:{" "}
                  {activeBooking.pickup_location.coordinates[1]}, Longitude:{" "}
                  {activeBooking.pickup_location.coordinates[0]}
                </p>
                <p>
                  <strong>Drop-off Location:</strong> Latitude:{" "}
                  {activeBooking.dropoff_location.coordinates[1]}, Longitude:{" "}
                  {activeBooking.dropoff_location.coordinates[0]}
                </p>
                <p>
                  <strong>Vehicle Type:</strong> {activeBooking.vehicle_type}
                </p>
                <p>
                  <strong>Price Estimate:</strong> ₹
                  {activeBooking.price_estimate}
                </p>
                <p>
                  <strong>Status:</strong> {bookingStatus}
                </p>
              </div>
              {driverDetails && (
                <div>
                  <h3 className="text-xl font-semibold">Driver Details</h3>
                  <p>
                    <strong>Name:</strong> {driverDetails.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {driverDetails.email}
                  </p>
                  <p>
                    <strong>Vehicle ID:</strong> {driverDetails.vehicle_id}
                  </p>
                  <p>
                    <strong>Status:</strong> {driverDetails.status}
                  </p>
                </div>
              )}
            </div>
          ) : showBookingForm ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">Create a New Booking</h2>
              {error && <p className="text-red-500 mb-2">{error}</p>}
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Autocomplete Search for Pickup Location */}
                <AutocompleteSearch
                  label="Pickup"
                  onSelect={handlePickupSelect}
                />

                {/* Autocomplete Search for Drop-off Location */}
                <AutocompleteSearch
                  label="Drop-off"
                  onSelect={handleDropoffSelect}
                />

                {/* Vehicle Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="bike">Bike</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                  </select>
                </div>

                {/* Scheduled Time (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Scheduled Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                {/* Price Estimate */}
                {priceEstimate && (
                  <div>
                    <p className="text-green-600">
                      <strong>Price Estimate:</strong> ₹{priceEstimate}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handlePriceEstimate}
                    disabled={loading}
                    className={`bg-blue-500 text-white px-4 py-2 rounded-md ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Calculating..." : "Get Price Estimate"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-green-500 text-white px-4 py-2 rounded-md ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Booking..." : "Book Now"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    disabled={loading}
                    className={`bg-gray-500 text-white px-4 py-2 rounded-md ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">Welcome to Logi</h2>
              <button
                onClick={() => setShowBookingForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                Create a New Booking
              </button>
            </div>
          )
        }
      </div>

      {/* Right Column */}
      <div className="md:w-2/3 h-full">
        <MapView
          role="user"
          userLocation={userLocation}
          driverLocation={driverLocation}
          pickupLocation={
            activeBooking
              ? {
                  latitude: activeBooking.pickup_location.coordinates[1],
                  longitude: activeBooking.pickup_location.coordinates[0],
                }
              : null
          }
          dropoffLocation={dropoffLocation}
          bookingStatus={bookingStatus}
        />
      </div>
    </div>
  );
};

export default UserDashboard;
