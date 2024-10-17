// src/components/Driver/DriverDashboard.js

import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../services/api";
import MapView from "../Map/MapView";
import AvailabilitySwitch from "../shared/AvailabilitySwitch";
import { clearMessages, receiveMessage } from "../../slices/websocketSlice";
import routingService from "../../services/routingService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./DriverDashboard.css"; // Optional: For custom styling

const DriverDashboard = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.websocket.messages);
  const [isOnline, setIsOnline] = useState(false); // Initially Offline
  const [bookingDetails, setBookingDetails] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bookingTimeoutRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length === 0) return;

    messages.forEach((msg) => {
      if (msg.type === "new_booking_request" && isOnline && !bookingDetails) {
        console.log("New booking request received:", msg.payload);
        // New booking request received
        handleNewBookingRequest(msg.payload);
      }
      // Handle other message types if needed
    });
    // Clear messages after processing to prevent duplicate handling
    dispatch(clearMessages());
    // eslint-disable-next-line
  }, [messages, isOnline, bookingDetails]);

  // Check for active bookings on component mount
  useEffect(() => {
    checkActiveBooking();
  }, []);

  useEffect(() => {
    if (bookingDetails) {
      if (
        bookingDetails.status === "Driver Assigned" ||
        bookingDetails.status === "En Route to Pickup"
      ) {
        fetchRoute(driverLocation, bookingDetails.pickup_location);
      }
      if (
        bookingDetails.status === "In Transit" ||
        bookingDetails.status === "Goods Collected"
      ) {
        fetchRoute(driverLocation, bookingDetails.dropoff_location);
      }
    }
  }, [driverLocation, bookingDetails]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  // Handle availability toggle
  const handleToggleAvailability = async (checked) => {
    setIsOnline(checked);
    if (checked) {
      // Driver is now online
      startSendingLocation();
      // Optionally, notify backend about availability
      try {
        await api.post("/drivers/status", { status: "Available" });
        toast.success("You are now Online.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update availability.");
      }
    } else {
      // Driver is now offline
      stopSendingLocation();
      // Optionally, notify backend about availability
      try {
        await api.post("/drivers/status", { status: "offline" });
        toast.info("You are now Offline.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update availability.");
      }
    }
  };

  // Start sending location every 5 seconds
  const startSendingLocation = () => {
    sendLocation(); // Send immediately
    locationIntervalRef.current = setInterval(sendLocation, 5000);
  };

  // Stop sending location
  const stopSendingLocation = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation({
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

  // Send current location to backend
  const sendLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setDriverLocation({ latitude, longitude });
        try {
          await api.post("/drivers/update-location", { latitude, longitude });
        } catch (err) {
          console.error("Error sending location:", err);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to retrieve your location.");
      }
    );
  };

  // Check for active booking
  const checkActiveBooking = async () => {
    setLoading(true);
    var posi = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          posi = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setDriverLocation({
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
    try {
      const res = await api.get("/drivers/active-bookings");
      console.log("active booking", res.data);
      if (res.data) {
        fetchBookingDetails(res.data[0].id, posi);
      }
    } catch (err) {
      console.error("No active booking found.");
      // No active booking, continue as normal
    } finally {
      setLoading(false);
    }
  };

  // Fetch booking details
  const fetchBookingDetails = async (bookingId, driverLocation) => {
    try {
      const res = await api.get(`/drivers/bookings/${bookingId}`);
      if (res.data) {
        setBookingDetails(res.data);
      }
    } catch (err) {
      console.error("Error fetching booking details:", err);
      toast.error("Failed to fetch booking details.");
    }
  };

  // Handle new booking request
  const handleNewBookingRequest = async (booking) => {
    setBookingDetails(booking);
    toast.info("New booking request received.");

    // Start 1-minute timeout to auto-reject
    bookingTimeoutRef.current = setTimeout(() => {
      handleRejectBooking(booking.id);
    }, 60000); // 60,000 ms = 1 minute
  };

  // Accept booking
  const handleAcceptBooking = async (bookingId) => {
    try {
      await api.post(`/drivers/respond-booking`, {
        booking_id: bookingId,
        response: "accept",
      });
      toast.success("Booking accepted.");
      clearTimeout(bookingTimeoutRef.current);
      // Fetch updated booking details
      fetchBookingDetails(bookingId);
    } catch (err) {
      console.error("Error accepting booking:", err);
      toast.error("Failed to accept booking.");
    }
  };

  // Reject booking
  const handleRejectBooking = async (bookingId) => {
    try {
      await api.post(`/drivers/respond-booking`, {
        booking_id: bookingId,
        response: "reject",
      });
      toast.warn("Booking rejected.");
      setBookingDetails(null);
    } catch (err) {
      console.error("Error rejecting booking:", err);
      toast.error("Failed to reject booking.");
    }
  };

  // Change booking status (e.g., Picked Up, Completed)
  const handleChangeBookingStatus = async (newStatus) => {
    try {
      await api.post(`/drivers/booking-status`, {
        booking_id: bookingDetails.id,
        status: newStatus,
      });
      toast.success(`Booking status updated to ${newStatus}.`);
      // If status is 'Completed', clear booking
      if (newStatus === "Completed") {
        setBookingDetails(null);
        setRouteCoordinates([]);
      } else {
        // Fetch updated booking details
        fetchBookingDetails(bookingDetails.id);
      }
    } catch (err) {
      console.error("Error updating booking status:", err);
      toast.error("Failed to update booking status.");
    }
  };

  // Fetch route between two points
  const fetchRoute = async (start, end) => {
    if (!start || !end) return;
    const startCoords = {
      latitude: parseFloat(start.latitude),
      longitude: parseFloat(start.longitude),
    };
    const endCoords = {
      latitude: parseFloat(end.coordinates[0]),
      longitude: parseFloat(end.coordinates[1]),
    };
    const route = await routingService.getRoute(startCoords, endCoords);
    if (route) {
      setRouteCoordinates(route);
    } else {
      setRouteCoordinates([]);
      toast.error("Failed to fetch route.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ToastContainer />
      {/* Left Column */}
      <div className="md:w-1/3 bg-gray-100 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Driver Dashboard</h2>
        {/* Availability Switch */}
        <AvailabilitySwitch
          isOnline={isOnline}
          handleToggle={handleToggleAvailability}
        />

        {/* Conditional Rendering Based on Booking Status */}
        {loading ? (
          <p className="text-blue-500">Loading...</p>
        ) : bookingDetails ? (
          <div>
            <h3 className="text-xl font-semibold mb-2">Current Booking</h3>
            <p>
              <strong>Pickup Location:</strong>{" "}
              {bookingDetails
                ? `Lat: ${bookingDetails.pickup_location.coordinates[0]}, Lng: ${bookingDetails.pickup_location.coordinates[1]}`
                : "N/A"}
            </p>
            <p>
              <strong>Drop-off Location:</strong>{" "}
              {bookingDetails
                ? `Lat: ${bookingDetails.dropoff_location.coordinates[0]}, Lng: ${bookingDetails.dropoff_location.coordinates[1]}`
                : "N/A"}
            </p>
            <p>
              <strong>Vehicle Type:</strong> {bookingDetails.vehicle_type}
            </p>
            <p>
              <strong>Status:</strong> {bookingDetails.status}
            </p>

            {/* If booking is pending, show Accept and Reject buttons */}
            {bookingDetails.status === "Pending" && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleAcceptBooking(bookingDetails?.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRejectBooking(bookingDetails?.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  Reject
                </button>
              </div>
            )}

            {/* If booking is accepted or in transit, show status update options */}
            {bookingDetails.status !== "Pending" && (
              <div className="mt-4">
                <h4 className="text-lg font-medium">Update Booking Status</h4>
                <div className="mt-2 flex space-x-2">
                  {bookingDetails.status === "Driver Assigned" && (
                    <button
                      onClick={() =>
                        handleChangeBookingStatus("En Route to Pickup")
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded-md"
                    >
                      En Route to Pickup
                    </button>
                  )}
                  {bookingDetails.status === "En Route to Pickup" && (
                    <button
                      onClick={() =>
                        handleChangeBookingStatus("Goods Collected")
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded-md"
                    >
                      Goods Collected
                    </button>
                  )}
                  {bookingDetails.status === "Goods Collected" && (
                    <button
                      onClick={() => handleChangeBookingStatus("In Transit")}
                      className="bg-green-500 text-white px-4 py-2 rounded-md"
                    >
                      In Transit
                    </button>
                  )}
                  {bookingDetails.status === "In Transit" && (
                    <button
                      onClick={() => handleChangeBookingStatus("Delivered")}
                      className="bg-green-500 text-white px-4 py-2 rounded-md"
                    >
                      Delivered
                    </button>
                  )}
                  {bookingDetails.status === "Delivered" && (
                    <button
                      onClick={() => handleChangeBookingStatus("Completed")}
                      className="bg-green-500 text-white px-4 py-2 rounded-md"
                    >
                      Completed
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          isOnline && (
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Waiting for Booking Request
              </h3>
              <p>Your status is Online. Waiting for booking requests...</p>
            </div>
          )
        )}
      </div>

      {/* Right Column */}
      <div className="md:w-2/3 h-full">
        <MapView
          role="driver"
          userLocation={null} // Drivers don't need to see their own location as 'userLocation'
          driverLocation={driverLocation}
          pickupLocation={
            bookingDetails ? bookingDetails.pickup_location : null
          }
          dropoffLocation={
            bookingDetails ? bookingDetails.dropoff_location : null
          }
          bookingStatus={bookingDetails ? bookingDetails.status : null}
          routeCoordinates={routeCoordinates}
        />
      </div>
    </div>
  );
};

export default DriverDashboard;
