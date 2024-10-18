// src/components/User/UserDashboard.js

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../services/api";
import MapView from "../Map/MapView";
import { clearMessages } from "../../slices/websocketSlice";
import routingService from "../../services/routingService";
import geocodingService from "../../services/geoCodingService"; // Import geocoding service
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
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [formData, setFormData] = useState({
    vehicleType: "car",
    scheduledTime: "",
  });
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);

  // New state variables for place names
  const [pickupName, setPickupName] = useState("");
  const [dropoffName, setDropoffName] = useState("");

  // Fetch active booking on component mount
  useEffect(() => {
    fetchActiveBooking();
    getUserCurrentLocation();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (activeBooking) {
      // Fetch place names
      const fetchPlaceNames = async () => {
        const pickupLat = activeBooking.pickup_location.coordinates[0];
        const pickupLng = activeBooking.pickup_location.coordinates[1];
        const dropoffLat = activeBooking.dropoff_location.coordinates[0];
        const dropoffLng = activeBooking.dropoff_location.coordinates[1];

        const fetchedPickupName = await geocodingService.getPlaceName(
          pickupLat,
          pickupLng
        );
        const fetchedDropoffName = await geocodingService.getPlaceName(
          dropoffLat,
          dropoffLng
        );

        setPickupName(fetchedPickupName);
        setDropoffName(fetchedDropoffName);
      };

      fetchPlaceNames();
    }
  }, [activeBooking]);

  useEffect(() => {
    if (activeBooking) {
      if (activeBooking.status === "Pending") {
        fetchRoute(
          {
            latitude: activeBooking.pickup_location.coordinates[0],
            longitude: activeBooking.pickup_location.coordinates[1],
          },
          {
            latitude: activeBooking.dropoff_location.coordinates[0],
            longitude: activeBooking.dropoff_location.coordinates[1],
          }
        );
      }
      if (driverLocation) {
        if (
          activeBooking.status === "Driver Assigned" ||
          activeBooking.status === "En Route to Pickup"
        ) {
          fetchRoute(driverLocation, {
            latitude: activeBooking.pickup_location.coordinates[0],
            longitude: activeBooking.pickup_location.coordinates[1],
          });
        } else if (
          activeBooking.status === "In Transit" ||
          activeBooking.status === "Goods Collected"
        ) {
          fetchRoute(driverLocation, {
            latitude: activeBooking.dropoff_location.coordinates[0],
            longitude: activeBooking.dropoff_location.coordinates[1],
          });
        }
      }
    }
  }, [driverLocation, activeBooking]);

  // Listen to WebSocket messages
  useEffect(() => {
    if (messages.length === 0) return;

    messages.forEach((msg) => {
      if (msg.type === "booking_accepted") {
        if (msg.payload.booking_id === activeBooking?.id) {
          toast.info("Booking Accepted");
          setActiveBooking({ ...activeBooking, status: "Driver Assigned" });
          fetchDriverDetails(activeBooking.id);
        }
      }
      if (msg.type === "status_update") {
        if (msg.payload.booking_id === activeBooking?.id) {
          toast.info(`Booking Status Updated: ${msg.payload.status}`);
          if (msg.payload.status === "Completed") {
            setActiveBooking(null);
            setDriverDetails(null);
            setRouteCoordinates([]);
            setDriverLocation(null);
            setPickupName("");
            setDropoffName("");
          } else {
            setActiveBooking({ ...activeBooking, status: msg.payload.status });
          }
        }
      }
      if (msg.type === "driver_location") {
        console.log("Driver Location:", msg);
        if (msg.payload.booking_id === activeBooking?.id) {
          setDriverLocation({
            latitude: msg.payload.latitude,
            longitude: msg.payload.longitude,
          });
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
        fetchDriverDetails(response.data.id);
      }
    } catch (error) {
      console.error("Error fetching active booking:", error);
      // No active booking, continue as normal
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverDetails = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/driver`);
      if (response.data) {
        console.log("driver details", response.data);
        setDriverDetails(response.data);
        setDriverLocation({
          latitude: response.data.location?.coordinates[0],
          longitude: response.data.location?.coordinates[1],
        });
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
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
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
    // Removed pickup and dropoff inputs as they're handled by AutocompleteSearch
    // Updated formData to exclude pickup and dropoff coordinates
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
          name: pickupName, // Include place name
        },
        dropoff_location: {
          type: "Point",
          coordinates: [
            parseFloat(dropoff.latitude),
            parseFloat(dropoff.longitude),
          ],
          name: dropoffName, // Include place name
        },
        vehicle_type: formData.vehicleType,
        scheduled_time: formData.scheduledTime
          ? new Date(formData.scheduledTime).toISOString()
          : null,
      };

      const response = await api.post("/bookings", bookingRequest);
      if (response.data) {
        console.log("booking created", response.data);
        setActiveBooking(response.data);
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
    if (!pickup || !dropoff) {
      setError("Please select both pickup and drop-off locations.");
      toast.error("Please select both pickup and drop-off locations.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const estimateRequest = {
        pickup_location: {
          type: "Point",
          coordinates: [
            parseFloat(pickup.longitude),
            parseFloat(pickup.latitude),
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

  // Fetch route between two points
  const fetchRoute = async (start, end) => {
    console.log("Fetching route...");
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
      setRouteCoordinates(route);
    } else {
      setRouteCoordinates([]);
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
    setPickupName(location.name); // Set place name
  };

  const handleDropoffSelect = (location) => {
    setFormData({
      ...formData,
      dropoffLongitude: location?.longitude,
      dropoffLatitude: location?.latitude,
    });
    setDropoff(location);
    setDropoffName(location.name); // Set place name
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ToastContainer />
      {/* Left Column */}
      <div className="md:w-1/3 bg-gray-100 p-6 overflow-auto">
        {loading && <p className="text-blue-500">Loading...</p>}
        {activeBooking ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Active Booking</h2>
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Booking Details</h3>
              <p>
                <strong>Pickup Location:</strong> {pickupName || "Loading..."}
              </p>
              <p>
                <strong>Drop-off Location:</strong> {dropoffName || "Loading..."}
              </p>
              <p>
                <strong>Vehicle Type:</strong> {activeBooking.vehicle_type}
              </p>
              <p>
                <strong>Fare:</strong> ₹{activeBooking.price_estimate}
              </p>
              <p>
                <strong>Status:</strong> {activeBooking.status}
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
        )}
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
                  latitude: activeBooking.pickup_location.coordinates[0],
                  longitude: activeBooking.pickup_location.coordinates[1],
                }
              : null
          }
          dropoffLocation={
            activeBooking
              ? {
                  latitude: activeBooking.dropoff_location.coordinates[0],
                  longitude: activeBooking.dropoff_location.coordinates[1],
                }
              : null
          }
          pickupName={pickupName} // Pass place name
          dropoffName={dropoffName} // Pass place name
          bookingStatus={activeBooking?.status}
          routeCoordinates={routeCoordinates}
        />
      </div>
    </div>
  );
};

export default UserDashboard;
