import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaBoxOpen, FaMapMarkerAlt, FaUser, FaEnvelope, FaCar, FaRupeeSign, FaTimes } from "react-icons/fa";

import api from "../../services/api";
import MapView from "../Map/MapView";
import AutocompleteSearch from "../Map/AutocompleteSearch";
import { clearMessages } from "../../slices/websocketSlice";
import routingService from "../../services/routingService";
import geocodingService from "../../services/geoCodingService";
import { fromGeoJSONPoint, toGeoJSONPoint } from "../../services/location";

import Button from "../shared/Button";
import Select from "../shared/Select";
import Badge from "../shared/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "../shared/Card";
import Skeleton from "../shared/Skeleton";

const STATUS_META = {
  Pending: { tone: "warning", label: "Searching for driver" },
  "Driver Assigned": { tone: "brand", label: "Driver assigned" },
  "En Route to Pickup": { tone: "brand", label: "Driver on the way" },
  "Goods Collected": { tone: "brand", label: "Picked up" },
  "In Transit": { tone: "brand", label: "In transit" },
  Delivered: { tone: "success", label: "Delivered" },
  Completed: { tone: "success", label: "Completed" },
};

function statusMeta(status) {
  return STATUS_META[status] || { tone: "neutral", label: status || "Unknown" };
}

function DetailLine({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 text-ink-400 dark:text-ink-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
        <p className="text-sm text-ink-900 dark:text-ink-50 font-medium break-words">
          {children}
        </p>
      </div>
    </div>
  );
}

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupName, setPickupName] = useState("");
  const [dropoffName, setDropoffName] = useState("");

  useEffect(() => {
    fetchActiveBooking();
    getUserCurrentLocation();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!activeBooking) return;
    const fetchPlaceNames = async () => {
      const pickupLocation = fromGeoJSONPoint(activeBooking.pickup_location);
      const dropoffLocation = fromGeoJSONPoint(activeBooking.dropoff_location);
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
  }, [activeBooking]);

  useEffect(() => {
    if (!activeBooking) return;
    const pickupLocation = fromGeoJSONPoint(activeBooking.pickup_location);
    const dropoffLocation = fromGeoJSONPoint(activeBooking.dropoff_location);
    if (!pickupLocation || !dropoffLocation) return;

    if (activeBooking.status === "Pending") {
      fetchRoute(pickupLocation, dropoffLocation);
    }
    if (driverLocation) {
      if (
        activeBooking.status === "Driver Assigned" ||
        activeBooking.status === "En Route to Pickup"
      ) {
        fetchRoute(driverLocation, pickupLocation);
      } else if (
        activeBooking.status === "In Transit" ||
        activeBooking.status === "Goods Collected" ||
        activeBooking.status === "Delivered"
      ) {
        fetchRoute(driverLocation, dropoffLocation);
      }
    }
    // eslint-disable-next-line
  }, [driverLocation, activeBooking]);

  useEffect(() => {
    if (messages.length === 0) return;
    messages.forEach((msg) => {
      if (msg.type === "booking_accepted" && msg.payload.booking_id === activeBooking?.id) {
        toast.info("Booking accepted");
        setActiveBooking({ ...activeBooking, status: "Driver Assigned" });
        fetchDriverDetails(activeBooking.id);
      }
      if (msg.type === "status_update" && msg.payload.booking_id === activeBooking?.id) {
        toast.info(`Booking status updated: ${msg.payload.status}`);
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
      if (msg.type === "driver_location" && msg.payload.booking_id === activeBooking?.id) {
        setDriverLocation({
          latitude: msg.payload.latitude,
          longitude: msg.payload.longitude,
        });
      }
    });
    dispatch(clearMessages());
    // eslint-disable-next-line
  }, [messages]);

  const fetchActiveBooking = async () => {
    setInitialLoading(true);
    try {
      const response = await api.get("/active-booking");
      if (response.data) {
        setActiveBooking(response.data);
        fetchDriverDetails(response.data.id);
      }
    } catch (err) {
      console.error("Error fetching active booking:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchDriverDetails = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/driver`);
      if (response.data) {
        setDriverDetails(response.data);
        setDriverLocation(fromGeoJSONPoint(response.data.location));
      }
    } catch (err) {
      console.error("Error fetching driver details:", err);
      setError(err?.response?.data?.error);
    }
  };

  const getUserCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        console.error("Error getting user location:", err);
        toast.error("Error getting user location");
      },
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!pickup || !dropoff) {
      setError("Please select both pickup and drop-off locations.");
      toast.error("Please select both pickup and drop-off locations.");
      return;
    }
    setBooking(true);
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/bookings", {
        pickup_location: toGeoJSONPoint(pickup),
        dropoff_location: toGeoJSONPoint(dropoff),
        vehicle_type: formData.vehicleType,
        scheduled_time: formData.scheduledTime
          ? new Date(formData.scheduledTime).toISOString()
          : null,
      });
      if (response.data) {
        setActiveBooking(response.data);
        setShowBookingForm(false);
        toast.success("Booking created successfully.");
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setError(err?.response?.data?.error);
      toast.error(err?.response?.data?.error);
    } finally {
      setBooking(false);
      setLoading(false);
    }
  };

  const handlePriceEstimate = async () => {
    if (!pickup || !dropoff) {
      setError("Please select both pickup and drop-off locations.");
      toast.error("Please select both pickup and drop-off locations.");
      return;
    }
    setEstimating(true);
    setError(null);
    try {
      const response = await api.post("/bookings/estimate", {
        pickup_location: toGeoJSONPoint(pickup),
        dropoff_location: toGeoJSONPoint(dropoff),
        vehicle_type: formData.vehicleType,
      });
      if (response.data) {
        setPriceEstimate(response.data.estimated_price);
        toast.info(`Price estimate: ₹${response.data.estimated_price}`);
      }
    } catch (err) {
      console.error("Error getting price estimate:", err);
      setError(err?.response?.data?.error);
      toast.error(err?.response?.data?.error);
    } finally {
      setEstimating(false);
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

  const handlePickupSelect = (location) => {
    setPickup(location);
    setPickupName(location.name);
  };

  const handleDropoffSelect = (location) => {
    setDropoff(location);
    setDropoffName(location.name);
  };

  const renderLeftPanel = () => {
    if (initialLoading) {
      return (
        <div className="space-y-4">
          <Skeleton height={28} className="w-40" />
          <Card>
            <CardBody className="space-y-3">
              <Skeleton height={14} className="w-24" />
              <Skeleton height={14} className="w-full" />
              <Skeleton height={14} className="w-3/4" />
            </CardBody>
          </Card>
        </div>
      );
    }

    if (activeBooking) {
      const meta = statusMeta(activeBooking.status);
      return (
        <div className="space-y-4 animate-fade-in">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
              Your trip
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-50">{meta.label}</h2>
              <Badge tone={meta.tone} dot>{activeBooking.status}</Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking details</CardTitle>
            </CardHeader>
            <CardBody className="py-2">
              <DetailLine icon={FaMapMarkerAlt} label="Pickup">
                {pickupName || <Skeleton height={14} className="w-40" />}
              </DetailLine>
              <DetailLine icon={FaMapMarkerAlt} label="Drop-off">
                {dropoffName || <Skeleton height={14} className="w-40" />}
              </DetailLine>
              <DetailLine icon={FaCar} label="Vehicle">
                <span className="capitalize">{activeBooking.vehicle_type}</span>
              </DetailLine>
              <DetailLine icon={FaRupeeSign} label="Fare">
                ₹{activeBooking.price_estimate}
              </DetailLine>
            </CardBody>
          </Card>

          {driverDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Your driver</CardTitle>
                <Badge
                  tone={driverDetails.status === "Available" ? "success" : "warning"}
                  dot
                >
                  {driverDetails.status}
                </Badge>
              </CardHeader>
              <CardBody className="py-2">
                <DetailLine icon={FaUser} label="Name">
                  {driverDetails.name}
                </DetailLine>
                <DetailLine icon={FaEnvelope} label="Email">
                  {driverDetails.email}
                </DetailLine>
                <DetailLine icon={FaCar} label="Vehicle ID">
                  <span className="font-mono text-xs">{driverDetails.vehicle_id}</span>
                </DetailLine>
              </CardBody>
            </Card>
          )}
        </div>
      );
    }

    if (showBookingForm) {
      return (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
                New booking
              </p>
              <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-50">Where to?</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookingForm(false)}
              aria-label="Cancel"
            >
              <FaTimes />
            </Button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 text-danger-700 text-sm px-3 py-2 dark:bg-danger-500/10 dark:text-danger-500"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <AutocompleteSearch label="Pickup" onSelect={handlePickupSelect} />
            <AutocompleteSearch label="Drop-off" onSelect={handleDropoffSelect} />

            <Select
              label="Vehicle type"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleInputChange}
              required
            >
              <option value="bike">Bike</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
            </Select>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="scheduledTime"
                className="text-sm font-medium text-ink-700 dark:text-ink-200"
              >
                Scheduled time <span className="text-ink-400 dark:text-ink-500 font-normal">(optional)</span>
              </label>
              <input
                id="scheduledTime"
                type="datetime-local"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                className="h-10 px-3 text-sm rounded-lg border border-ink-200 bg-white text-ink-900 outline-none transition-shadow focus:border-brand-500 focus:shadow-focus dark:bg-ink-800 dark:border-ink-700 dark:text-ink-50"
              />
            </div>

            {priceEstimate !== null && (
              <div className="rounded-lg bg-success-50 border border-success-500/30 px-3 py-2.5 flex items-center justify-between dark:bg-success-500/10">
                <span className="text-sm text-success-700 dark:text-success-500">Estimated fare</span>
                <span className="text-lg font-semibold text-success-700 dark:text-success-500">
                  ₹{priceEstimate}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Button type="submit" fullWidth loading={booking}>
                {booking ? "Booking..." : "Book now"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handlePriceEstimate}
                loading={estimating}
              >
                {estimating ? "Calculating..." : "Get price estimate"}
              </Button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center text-center py-10 animate-fade-in">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 dark:bg-brand-500/15 dark:text-brand-300">
          <FaBoxOpen size={24} />
        </div>
        <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-50">Ready to ship?</h2>
        <p className="mt-1 mb-5 text-sm text-ink-500 dark:text-ink-400 max-w-xs">
          Book a delivery with a driver in minutes. Track it live on the map.
        </p>
        <Button onClick={() => setShowBookingForm(true)} size="lg">
          Create a booking
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
      <ToastContainer position="top-right" hideProgressBar={false} closeOnClick pauseOnHover newestOnTop />

      <div className="md:w-[380px] md:shrink-0 bg-ink-50 dark:bg-ink-900 border-b md:border-b-0 md:border-r border-ink-100 dark:border-ink-800 p-5 md:p-6 overflow-auto md:max-h-[calc(100vh-3.5rem)]">
        {renderLeftPanel()}
      </div>

      <div className="flex-1 min-h-[400px] md:min-h-0">
        <MapView
          role="user"
          userLocation={userLocation}
          driverLocation={driverLocation}
          pickupLocation={
            activeBooking ? fromGeoJSONPoint(activeBooking.pickup_location) : null
          }
          dropoffLocation={
            activeBooking ? fromGeoJSONPoint(activeBooking.dropoff_location) : null
          }
          pickupName={pickupName}
          dropoffName={dropoffName}
          bookingStatus={activeBooking?.status}
          routeCoordinates={routeCoordinates}
        />
      </div>
    </div>
  );
};

export default UserDashboard;
