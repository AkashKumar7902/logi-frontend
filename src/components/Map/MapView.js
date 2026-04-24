import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";

import {
  pickupIcon,
  dropoffIcon,
  driverIcon,
  userIcon,
  ROUTE_COLORS,
} from "./markers";

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [60, 60] });
    }
  }, [bounds, map]);
  return null;
};

const PRE_TRIP = new Set(["Pending"]);
const EN_ROUTE_PICKUP = new Set(["Driver Assigned", "En Route to Pickup"]);
const EN_ROUTE_DROPOFF = new Set(["Goods Collected", "In Transit", "Delivered"]);
const SHOW_PICKUP = new Set([
  "Pending",
  "Driver Assigned",
  "En Route to Pickup",
  "Completed",
]);
const SHOW_DROPOFF = new Set([
  "Pending",
  "Goods Collected",
  "In Transit",
  "Delivered",
  "Completed",
]);

function PopupLabel({ label, title }) {
  return (
    <>
      <div className="logi-popup-label">{label}</div>
      <div className="logi-popup-title">{title}</div>
    </>
  );
}

const MapView = ({
  role,
  userLocation,
  driverLocation,
  pickupLocation,
  dropoffLocation,
  pickupName,
  dropoffName,
  bookingStatus,
  routeCoordinates,
}) => {
  const [bounds, setBounds] = useState([]);

  useEffect(() => {
    const pts = [];
    const addPt = (loc) => {
      if (loc && loc.latitude != null && loc.longitude != null) {
        pts.push([loc.latitude, loc.longitude]);
      }
    };

    if (role === "user") {
      if (PRE_TRIP.has(bookingStatus)) {
        addPt(pickupLocation);
        addPt(dropoffLocation);
      } else if (EN_ROUTE_PICKUP.has(bookingStatus)) {
        addPt(driverLocation);
        addPt(pickupLocation);
      } else if (EN_ROUTE_DROPOFF.has(bookingStatus)) {
        addPt(driverLocation);
        addPt(dropoffLocation);
      } else {
        addPt(userLocation);
      }
    }

    if (role === "driver") {
      if (EN_ROUTE_PICKUP.has(bookingStatus)) {
        addPt(driverLocation);
        addPt(pickupLocation);
      } else if (EN_ROUTE_DROPOFF.has(bookingStatus)) {
        addPt(driverLocation);
        addPt(dropoffLocation);
      } else {
        addPt(driverLocation);
      }
    }

    setBounds(pts);
  }, [role, bookingStatus, userLocation, driverLocation, pickupLocation, dropoffLocation]);

  const center = useMemo(() => {
    if (role === "driver" && driverLocation) {
      return [driverLocation.latitude, driverLocation.longitude];
    }
    if (role === "user" && userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    return [20.5937, 78.9629];
  }, [role, driverLocation, userLocation]);

  const showDriverMarker =
    driverLocation &&
    (role === "driver" || (role === "user" && bookingStatus && bookingStatus !== "Pending"));

  const showUserMarker =
    role === "user" && !bookingStatus && userLocation;

  const showPickupMarker = pickupLocation && SHOW_PICKUP.has(bookingStatus);
  const showDropoffMarker = dropoffLocation && SHOW_DROPOFF.has(bookingStatus);

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full"
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {showDriverMarker && (
        <Marker
          position={[driverLocation.latitude, driverLocation.longitude]}
          icon={driverIcon}
        >
          <Popup>
            <PopupLabel
              label={role === "driver" ? "You" : "Driver"}
              title={role === "driver" ? "Your current location" : "Live driver location"}
            />
          </Popup>
        </Marker>
      )}

      {showUserMarker && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        >
          <Popup>
            <PopupLabel label="You" title="Your current location" />
          </Popup>
        </Marker>
      )}

      {showPickupMarker && (
        <Marker
          position={[pickupLocation.latitude, pickupLocation.longitude]}
          icon={pickupIcon}
        >
          <Popup>
            <PopupLabel label="Pickup" title={pickupName || "Loading..."} />
          </Popup>
        </Marker>
      )}

      {showDropoffMarker && (
        <Marker
          position={[dropoffLocation.latitude, dropoffLocation.longitude]}
          icon={dropoffIcon}
        >
          <Popup>
            <PopupLabel label="Drop-off" title={dropoffName || "Loading..."} />
          </Popup>
        </Marker>
      )}

      {routeCoordinates && routeCoordinates.length > 0 && (
        <>
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: ROUTE_COLORS.outline,
              weight: 8,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: ROUTE_COLORS.main,
              weight: 4,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </>
      )}

      <FitBounds bounds={bounds} />
    </MapContainer>
  );
};

MapView.propTypes = {
  role: PropTypes.oneOf(["user", "driver"]).isRequired,
  userLocation: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }),
  driverLocation: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }),
  pickupLocation: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }),
  dropoffLocation: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }),
  pickupName: PropTypes.string,
  dropoffName: PropTypes.string,
  bookingStatus: PropTypes.string,
  routeCoordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
};

MapView.defaultProps = {
  userLocation: null,
  driverLocation: null,
  pickupLocation: null,
  dropoffLocation: null,
  pickupName: "",
  dropoffName: "",
  bookingStatus: null,
  routeCoordinates: [],
};

export default MapView;
