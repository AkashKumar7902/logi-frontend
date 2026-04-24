import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaCar,
  FaArrowRight,
  FaInbox,
} from "react-icons/fa";

import api from "../../services/api";
import MapView from "../Map/MapView";
import AvailabilitySwitch from "../shared/AvailabilitySwitch";
import { clearMessages } from "../../slices/websocketSlice";
import routingService from "../../services/routingService";
import geocodingService from "../../services/geoCodingService";
import { fromGeoJSONPoint } from "../../services/location";

import Button from "../shared/Button";
import Badge from "../shared/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "../shared/Card";

const STATUS_META = {
  Pending: { tone: "warning", label: "Pending" },
  "Driver Assigned": { tone: "brand", label: "Driver assigned" },
  "En Route to Pickup": { tone: "brand", label: "En route to pickup" },
  "Goods Collected": { tone: "brand", label: "Picked up" },
  "In Transit": { tone: "brand", label: "In transit" },
  Delivered: { tone: "success", label: "Delivered" },
  Completed: { tone: "success", label: "Completed" },
};

const STATUS_NEXT_ACTION = {
  "Driver Assigned": { next: "En Route to Pickup", label: "Start pickup" },
  "En Route to Pickup": { next: "Goods Collected", label: "Mark picked up" },
  "Goods Collected": { next: "In Transit", label: "Start transit" },
  "In Transit": { next: "Delivered", label: "Mark delivered" },
  Delivered: { next: "Completed", label: "Complete trip" },
};

function statusMeta(status) {
  return STATUS_META[status] || { tone: "neutral", label: status || "Unknown" };
}

const DriverDashboard = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.websocket.messages);
  const [isOnline, setIsOnline] = useState(false);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [pickupName, setPickupName] = useState("");
  const [dropoffName, setDropoffName] = useState("");

  const bookingTimeoutRef = useRef(null);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) return;
    messages.forEach((msg) => {
      if (msg.type === "new_booking_request" && isOnline) {
        handleNewBookingRequest(msg.payload);
      }
    });
    dispatch(clearMessages());
    // eslint-disable-next-line
  }, [messages, isOnline, bookingDetails]);

  useEffect(() => {
    checkActiveBooking();
    fetchPendingBookings();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!bookingDetails) return;
    const fetchPlaceNames = async () => {
      const pickupLocation = fromGeoJSONPoint(bookingDetails.pickup_location);
      const dropoffLocation = fromGeoJSONPoint(bookingDetails.dropoff_location);
      if (!pickupLocation || !dropoffLocation) return;
      const fetchedPickup = await geocodingService.getPlaceName(
        pickupLocation.latitude,
        pickupLocation.longitude,
      );
      const fetchedDrop = await geocodingService.getPlaceName(
        dropoffLocation.latitude,
        dropoffLocation.longitude,
      );
      setPickupName(fetchedPickup);
      setDropoffName(fetchedDrop);
    };
    fetchPlaceNames();

    const pickupLocation = fromGeoJSONPoint(bookingDetails.pickup_location);
    const dropoffLocation = fromGeoJSONPoint(bookingDetails.dropoff_location);
    if (!pickupLocation || !dropoffLocation) return;

    if (bookingDetails.status === "Pending") {
      fetchRoute(pickupLocation, dropoffLocation);
    }
    if (
      bookingDetails.status === "Driver Assigned" ||
      bookingDetails.status === "En Route to Pickup"
    ) {
      fetchRoute(driverLocation, pickupLocation);
    }
    if (
      bookingDetails.status === "In Transit" ||
      bookingDetails.status === "Goods Collected" ||
      bookingDetails.status === "Delivered"
    ) {
      fetchRoute(driverLocation, dropoffLocation);
    }
    // eslint-disable-next-line
  }, [driverLocation, bookingDetails]);

  useEffect(() => {
    const alreadyPresentInAll = bookingRequests.every(
      (b) => b.pickupName && b.dropoffName,
    );
    if (bookingRequests.length > 0 && !alreadyPresentInAll) {
      bookingRequests.forEach(async (booking) => {
        const pickupLocation = fromGeoJSONPoint(booking.pickup_location);
        const dropoffLocation = fromGeoJSONPoint(booking.dropoff_location);
        if (!pickupLocation || !dropoffLocation) return;
        const fetchedPickup = await geocodingService.getPlaceName(
          pickupLocation.latitude,
          pickupLocation.longitude,
        );
        const fetchedDrop = await geocodingService.getPlaceName(
          dropoffLocation.latitude,
          dropoffLocation.longitude,
        );
        setBookingRequests((prev) =>
          prev.map((b) =>
            b.id === booking.id
              ? { ...b, pickupName: fetchedPickup, dropoffName: fetchedDrop }
              : b,
          ),
        );
      });
    }
  }, [bookingRequests]);

  useEffect(() => {
    return () => {
      if (bookingTimeoutRef.current) clearTimeout(bookingTimeoutRef.current);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, []);

  const handleToggleAvailability = async (checked) => {
    if (checked === isOnline) return;
    if (checked) {
      try {
        await api.post("/drivers/status", { status: "Available" });
        setIsOnline(true);
        startSendingLocation();
        await fetchPendingBookings();
        toast.success("You are now online.");
      } catch (err) {
        console.error(err);
        setIsOnline(false);
        stopSendingLocation();
        toast.error("Failed to update availability.");
      }
    } else {
      try {
        await api.post("/drivers/status", { status: "Offline" });
        setIsOnline(false);
        stopSendingLocation();
        toast.info("You are now offline.");
      } catch (err) {
        console.error(err);
        setIsOnline(true);
        toast.error("Failed to update availability.");
      }
    }
  };

  const startSendingLocation = () => {
    stopSendingLocation();
    sendLocation();
    locationIntervalRef.current = setInterval(sendLocation, 5000);
  };

  const stopSendingLocation = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

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
      (err) => {
        console.error("Error getting location:", err);
        toast.error("Failed to retrieve your location.");
      },
    );
  };

  const checkActiveBooking = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Error getting user location:", err);
          toast.error("Error getting user location");
        },
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
    try {
      const res = await api.get("/drivers/active-bookings");
      if (res.data && res.data.length > 0) {
        setBookingDetails(res.data[0]);
      }
    } catch (err) {
      console.error("No active booking found.");
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const res = await api.get("/drivers/pending-bookings");
      if (Array.isArray(res.data)) {
        setBookingRequests(res.data);
        if (!bookingDetails && res.data.length > 0) {
          setBookingDetails(res.data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching pending bookings:", err);
    }
  };

  const fetchBookingDetails = async (bookingId) => {
    try {
      const res = await api.get(`/drivers/bookings/${bookingId}`);
      if (res.data) setBookingDetails(res.data);
    } catch (err) {
      console.error("Error fetching booking details:", err);
      toast.error("Failed to fetch booking details.");
    }
  };

  const handleNewBookingRequest = async (booking) => {
    setBookingRequests((prev) => [...prev, booking]);
    toast.info("New booking request received.");

    const pickupLocation = fromGeoJSONPoint(booking.pickup_location);
    const dropoffLocation = fromGeoJSONPoint(booking.dropoff_location);
    if (!pickupLocation || !dropoffLocation) return;

    const fetchedPickup = await geocodingService.getPlaceName(
      pickupLocation.latitude,
      pickupLocation.longitude,
    );
    const fetchedDrop = await geocodingService.getPlaceName(
      dropoffLocation.latitude,
      dropoffLocation.longitude,
    );

    setBookingDetails((prev) =>
      prev
        ? prev
        : { ...booking, pickupName: fetchedPickup, dropoffName: fetchedDrop },
    );
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await api.post(`/drivers/respond-booking`, {
        booking_id: bookingId,
        response: "accept",
      });
      toast.success("Booking accepted.");
      clearTimeout(bookingTimeoutRef.current);
      const accepted = bookingRequests.find((b) => b.id === bookingId);
      setBookingDetails({ ...accepted, status: "Driver Assigned" });
      setBookingRequests([]);
    } catch (err) {
      console.error("Error accepting booking:", err);
      toast.error("Failed to accept booking.");
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await api.post(`/drivers/respond-booking`, {
        booking_id: bookingId,
        response: "reject",
      });
      toast.warn("Booking rejected.");
      setBookingRequests((prev) => prev.filter((b) => b.id !== bookingId));
      if (bookingDetails && bookingDetails.id === bookingId) {
        const next = bookingRequests.find((b) => b.id !== bookingId);
        setBookingDetails(next || null);
      }
    } catch (err) {
      console.error("Error rejecting booking:", err);
      toast.error("Failed to reject booking.");
    }
  };

  const handleChangeBookingStatus = async (newStatus) => {
    try {
      await api.post(`/drivers/booking-status`, {
        booking_id: bookingDetails.id,
        status: newStatus,
      });
      toast.success(`Booking status updated to ${newStatus}.`);
      if (newStatus === "Completed") {
        setBookingDetails(null);
        setRouteCoordinates([]);
        setPickupName("");
        setDropoffName("");
        if (bookingRequests.length > 0) {
          setBookingDetails(bookingRequests[0]);
        }
      } else {
        fetchBookingDetails(bookingDetails.id);
      }
    } catch (err) {
      console.error("Error updating booking status:", err);
      toast.error("Failed to update booking status.");
    }
  };

  const fetchRoute = async (start, end) => {
    if (!start || !end) return;
    const route = await routingService.getRoute(
      { latitude: parseFloat(start.latitude), longitude: parseFloat(start.longitude) },
      { latitude: parseFloat(end.latitude), longitude: parseFloat(end.longitude) },
    );
    if (route) setRouteCoordinates(route);
    else {
      setRouteCoordinates([]);
      toast.error("Failed to fetch route.");
    }
  };

  const renderCurrentBooking = () => {
    if (!bookingDetails) return null;
    const meta = statusMeta(bookingDetails.status);
    const nextAction = STATUS_NEXT_ACTION[bookingDetails.status];

    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Current booking</CardTitle>
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="mt-0.5 text-ink-400 dark:text-ink-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-ink-500 dark:text-ink-400">Pickup</p>
              <p className="text-sm text-ink-900 dark:text-ink-50 font-medium break-words">
                {pickupName || <span className="text-ink-400 dark:text-ink-500">Loading...</span>}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="mt-0.5 text-ink-400 dark:text-ink-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-ink-500 dark:text-ink-400">Drop-off</p>
              <p className="text-sm text-ink-900 dark:text-ink-50 font-medium break-words">
                {dropoffName || <span className="text-ink-400 dark:text-ink-500">Loading...</span>}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-ink-100 dark:border-ink-700">
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Vehicle</p>
              <p className="text-sm text-ink-900 dark:text-ink-50 font-medium capitalize">
                {bookingDetails.vehicle_type}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Fare</p>
              <p className="text-sm text-ink-900 dark:text-ink-50 font-semibold">
                ₹{bookingDetails.price_estimate}
              </p>
            </div>
          </div>

          {nextAction && (
            <div className="pt-2">
              <Button
                fullWidth
                variant="success"
                rightIcon={<FaArrowRight />}
                onClick={() => handleChangeBookingStatus(nextAction.next)}
              >
                {nextAction.label}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  const renderRequestsList = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
          New requests
        </h3>
        <Badge tone="brand">{bookingRequests.length}</Badge>
      </div>
      <ul className="space-y-2.5">
        {bookingRequests.map((booking) => {
          const isActive = bookingDetails && bookingDetails.id === booking.id;
          return (
            <li
              key={booking.id}
              onClick={() => setBookingDetails(booking)}
              className={[
                "rounded-xl border p-3 cursor-pointer transition-all",
                isActive
                  ? "border-brand-500 bg-brand-50 shadow-card dark:bg-brand-500/15 dark:border-brand-400"
                  : "border-ink-100 bg-white hover:border-ink-200 hover:shadow-card dark:bg-ink-800 dark:border-ink-700 dark:hover:border-ink-600",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <FaMapMarkerAlt className="mt-0.5 text-ink-400 dark:text-ink-500 shrink-0 text-xs" />
                    <span className="text-sm text-ink-900 dark:text-ink-50 truncate">
                      {booking.pickupName || "Loading..."}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FaMapMarkerAlt className="mt-0.5 text-brand-500 shrink-0 text-xs" />
                    <span className="text-sm text-ink-900 dark:text-ink-50 truncate">
                      {booking.dropoffName || "Loading..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pt-1 text-xs text-ink-500 dark:text-ink-400">
                    <span className="inline-flex items-center gap-1">
                      <FaRupeeSign className="text-xs" />
                      {booking.price_estimate}
                    </span>
                    {booking.vehicle_type && (
                      <span className="inline-flex items-center gap-1 capitalize">
                        <FaCar className="text-xs" />
                        {booking.vehicle_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptBooking(booking.id);
                    }}
                    aria-label="Accept booking"
                    className="px-2.5"
                  >
                    <FaCheck />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectBooking(booking.id);
                    }}
                    aria-label="Reject booking"
                    className="px-2.5 text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/15"
                  >
                    <FaTimes />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const renderEmpty = () => (
    <Card>
      <CardBody className="flex flex-col items-center text-center py-8">
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-3 ${
            isOnline
              ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
              : "bg-ink-100 text-ink-400 dark:bg-ink-700 dark:text-ink-500"
          }`}
        >
          <FaInbox size={20} />
        </div>
        <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">
          {isOnline ? "Waiting for requests" : "You're offline"}
        </h3>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 max-w-xs">
          {isOnline
            ? "We'll notify you as soon as a booking matches your location."
            : "Switch online to start receiving booking requests."}
        </p>
      </CardBody>
    </Card>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
      <ToastContainer position="top-right" hideProgressBar={false} closeOnClick pauseOnHover newestOnTop />

      <div className="md:w-[380px] md:shrink-0 bg-ink-50 dark:bg-ink-900 border-b md:border-b-0 md:border-r border-ink-100 dark:border-ink-800 p-5 md:p-6 overflow-auto md:max-h-[calc(100vh-3.5rem)]">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
            Driver
          </p>
          <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-50">Dashboard</h2>
        </div>

        <div className="mb-5">
          <AvailabilitySwitch
            isOnline={isOnline}
            handleToggle={handleToggleAvailability}
          />
        </div>

        {bookingRequests.length > 0
          ? renderRequestsList()
          : bookingDetails
            ? renderCurrentBooking()
            : renderEmpty()}
      </div>

      <div className="flex-1 min-h-[400px] md:min-h-0">
        <MapView
          role="driver"
          userLocation={null}
          driverLocation={driverLocation}
          pickupLocation={
            bookingDetails ? fromGeoJSONPoint(bookingDetails.pickup_location) : null
          }
          dropoffLocation={
            bookingDetails ? fromGeoJSONPoint(bookingDetails.dropoff_location) : null
          }
          pickupName={pickupName}
          dropoffName={dropoffName}
          bookingStatus={bookingDetails ? bookingDetails.status : null}
          routeCoordinates={routeCoordinates}
        />
      </div>
    </div>
  );
};

export default DriverDashboard;
