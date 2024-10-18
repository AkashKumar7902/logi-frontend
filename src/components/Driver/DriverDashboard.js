// src/components/Driver/DriverDashboard.js

import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../services/api";
import MapView from "../Map/MapView";
import AvailabilitySwitch from "../shared/AvailabilitySwitch";
import { clearMessages, receiveMessage } from "../../slices/websocketSlice";
import routingService from "../../services/routingService";
import geocodingService from "../../services/geoCodingService"; // Import geocoding service
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./DriverDashboard.css"; // Optional: For custom styling
import { FaCheck, FaTimes } from "react-icons/fa";

const DriverDashboard = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.websocket.messages);
  const [isOnline, setIsOnline] = useState(false); // Initially Offline
  const [bookingRequests, setBookingRequests] = useState([]); // Multiple booking requests
  const [bookingDetails, setBookingDetails] = useState(null); // Selected booking
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state variables for place names
  const [pickupName, setPickupName] = useState("");
  const [dropoffName, setDropoffName] = useState("");

  const bookingTimeoutRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length === 0) return;

    messages.forEach((msg) => {
      if (msg.type === "new_booking_request" && isOnline) {
        console.log("New booking request received:", msg.payload);
        // New booking request received
        handleNewBookingRequest(msg.payload);
      }
      // Handle other message types if needed
      if (msg.type === "driver_status_update") {
        // Example: Update driver status if needed
        // Implement as per your backend specifications
      }
    });
    // Clear messages after processing to prevent duplicate handling
    dispatch(clearMessages());
    // eslint-disable-next-line
  }, [messages, isOnline, bookingDetails]);

  // Check for active bookings on component mount
  useEffect(() => {
    checkActiveBooking();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (bookingDetails) {
      console.log(bookingDetails);
      // Fetch place names
      const fetchPlaceNames = async () => {
        const pickupLat = bookingDetails.pickup_location.coordinates[0];
        const pickupLng = bookingDetails.pickup_location.coordinates[1];
        const dropoffLat = bookingDetails.dropoff_location.coordinates[0];
        const dropoffLng = bookingDetails.dropoff_location.coordinates[1];

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

      if (bookingDetails.status === "Pending") {
        fetchRoute(
          {
            latitude: bookingDetails.pickup_location.coordinates[0],
            longitude: bookingDetails.pickup_location.coordinates[1],
          },
          {
            latitude: bookingDetails.dropoff_location.coordinates[0],
            longitude: bookingDetails.dropoff_location.coordinates[1],
          }
        );
      }
      if (
        bookingDetails.status === "Driver Assigned" ||
        bookingDetails.status === "En Route to Pickup"
      ) {
        fetchRoute(driverLocation, {
          latitude: bookingDetails.pickup_location.coordinates[0],
          longitude: bookingDetails.pickup_location.coordinates[1],
        });
      }
      if (
        bookingDetails.status === "In Transit" ||
        bookingDetails.status === "Goods Collected"
      ) {
        fetchRoute(driverLocation, {
          latitude: bookingDetails.dropoff_location.coordinates[0],
          longitude: bookingDetails.dropoff_location.coordinates[1],
        });
      }
    }
  }, [driverLocation, bookingDetails]);

  // add pickupname and dropoffname to booking requests
  useEffect(() => {
    // check if dropoffName and pickupName are already present
    var alreadyPresentInAll = true;
    bookingRequests.forEach((booking) => {
      if (!booking.pickupName || !booking.dropoffName) {
        alreadyPresentInAll = false;
      }
    });
    if (bookingRequests.length > 0 && !alreadyPresentInAll) {
      bookingRequests.forEach(async (booking) => {
        const pickupLat = booking.pickup_location.coordinates[0];
        const pickupLng = booking.pickup_location.coordinates[1];
        const dropoffLat = booking.dropoff_location.coordinates[0];
        const dropoffLng = booking.dropoff_location.coordinates[1];

        const fetchedPickupName = await geocodingService.getPlaceName(
          pickupLat,
          pickupLng
        );
        const fetchedDropoffName = await geocodingService.getPlaceName(
          dropoffLat,
          dropoffLng
        );

        setBookingRequests((prev) => {
          return prev.map((b) => {
            if (b.id === booking.id) {
              return {
                ...b,
                pickupName: fetchedPickupName,
                dropoffName: fetchedDropoffName,
              };
            }
            return b;
          });
        });
      });
    }
  }, [bookingRequests]);

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
        await api.post("/drivers/status", { status: "Offline" });
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
    let posi = null;
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
      if (res.data && res.data.length > 0) {
        setBookingDetails(res.data[0]);
      }
    } catch (err) {
      console.error("No active booking found.");
      // No active booking, continue as normal
    } finally {
      setLoading(false);
    }
  };

  // Fetch booking details
  const fetchBookingDetails = async (bookingId) => {
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
    setBookingRequests((prev) => [...prev, booking]);
    toast.info("New booking request received.");

    // Fetch place names for the new booking
    const pickupLat = booking.pickup_location.coordinates[0];
    const pickupLng = booking.pickup_location.coordinates[1];
    const dropoffLat = booking.dropoff_location.coordinates[0];
    const dropoffLng = booking.dropoff_location.coordinates[1];

    const fetchedPickupName = await geocodingService.getPlaceName(
      pickupLat,
      pickupLng
    );
    const fetchedDropoffName = await geocodingService.getPlaceName(
      dropoffLat,
      dropoffLng
    );

    // Update booking details if it's the first booking
    setBookingDetails((prev) => {
      if (!prev) {
        return {
          ...booking,
          pickupName: fetchedPickupName,
          dropoffName: fetchedDropoffName,
        };
      }
      return prev;
    });

    // // Start 1-minute timeout to auto-reject
    // bookingTimeoutRef.current = setTimeout(() => {
    //   handleRejectBooking(booking.id);
    // }, 60000); // 60,000 ms = 1 minute
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
      // Set the accepted booking as the current booking
      const acceptedBooking = bookingRequests.find((b) => b.id === bookingId);
      setBookingDetails(acceptedBooking);
      setBookingRequests([]);
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
      // Remove the rejected booking from bookingRequests
      setBookingRequests((prev) => prev.filter((b) => b.id !== bookingId));
      // If the rejected booking was the selected booking, select the next one
      if (bookingDetails && bookingDetails.id === bookingId) {
        const nextBooking = bookingRequests.find((b) => b.id !== bookingId);
        setBookingDetails(nextBooking || null);
      }
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
        setPickupName("");
        setDropoffName("");
        // Optionally, fetch next booking
        if (bookingRequests.length > 0) {
          const nextBooking = bookingRequests[0];
          setBookingDetails(nextBooking);
        }
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

  console.log(bookingRequests);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ToastContainer />
      {/* Left Column - Booking Requests */}
      <div className="md:w-1/3 bg-gray-100 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Driver Dashboard</h2>
        {/* Availability Switch */}
        <AvailabilitySwitch
          isOnline={isOnline}
          handleToggle={handleToggleAvailability}
        />

        {/* Booking Requests List */}
        {bookingRequests.length !== 0 ? (
          <div className="mt-6">
            <ul>
              {bookingRequests.map((booking) => (
                <li
                  key={booking.id}
                  className={`flex justify-between items-center p-2 mb-2 rounded cursor-pointer ${
                    bookingDetails && bookingDetails.id === booking.id
                      ? "bg-blue-100"
                      : "bg-white hover:bg-blue-50"
                  }`}
                  onClick={() => setBookingDetails(booking)}
                >
                  <div>
                    <p>
                      <strong>Pickup:</strong> {booking?.pickupName || "Loading..."}
                    </p>
                    <p>
                      <strong>Drop-off:</strong> {booking?.dropoffName || "Loading..."}
                    </p>
                    <p>
                      <strong>Fare:</strong> {booking.price_estimate}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptBooking(booking.id);
                      }}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                      title="Accept Booking"
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectBooking(booking.id);
                      }}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      title="Reject Booking"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : bookingDetails ? (
          <div className="mt-6 bg-white p-4 shadow rounded">
            <h3 className="text-xl font-semibold mb-2">Current Booking</h3>
            <p>
              <strong>Pickup Location:</strong> {pickupName || "Loading..."}
            </p>
            <p>
              <strong>Drop-off Location:</strong> {dropoffName || "Loading..."}
            </p>
            <p>
              <strong>Vehicle Type:</strong> {bookingDetails.vehicle_type}
            </p>
            <p>
              <strong>Status:</strong> {bookingDetails.status}
            </p>
            <p>
              <strong>Fare:</strong> ₹{bookingDetails.price_estimate}
            </p>

            {/* If booking is accepted or in transit, show status update options */}
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
          </div>
        ) : (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Booking Requests</h3>
            {isOnline ? (
              <p>No booking requests available. Looking for new requests.</p>
            ) : (
              <p>
                {" "}
                Please switch to online, to start getting booking requests{" "}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right Column - Map View */}
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
          pickupName={pickupName} // Pass place name
          dropoffName={dropoffName} // Pass place name
          bookingStatus={bookingDetails ? bookingDetails.status : null}
          routeCoordinates={routeCoordinates}
        />
      </div>
    </div>
  );
};

export default DriverDashboard;
