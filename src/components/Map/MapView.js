// src/components/Map/MapView.js

import React, { useEffect, useState } from "react";
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
import "react-toastify/dist/ReactToastify.css";

// Fix Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default,
  iconUrl: require("leaflet/dist/images/marker-icon.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
});

// Component to adjust map bounds
const FitBounds = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds);
      map.fitBounds(leafletBounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
};

const MapView = ({
  role, // 'user' or 'driver'
  userLocation,
  driverLocation,
  pickupLocation,
  dropoffLocation,
  bookingStatus,
  routeCoordinates,
}) => {
  const [bounds, setBounds] = useState([]);

  useEffect(() => {
    const newBounds = [];

    if (role === "user") {
      if (
        bookingStatus === "Driver Assigned" &&
        userLocation &&
        driverLocation
      ) {
        newBounds.push([userLocation.latitude, userLocation.longitude]);
        newBounds.push([
          driverLocation.coordinates[0],
          driverLocation.coordinates[1],
        ]);
      } else if (
        bookingStatus === "In Transit" &&
        driverLocation &&
        dropoffLocation
      ) {
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
        newBounds.push([
          dropoffLocation.coordinates[0],
          dropoffLocation.coordinates[1],
        ]);
      } else if (userLocation) {
        newBounds.push([userLocation.latitude, userLocation.longitude]);
      }
    }

    if (role === "driver") {
      if (
        (bookingStatus === "Driver Assigned" ||
          bookingStatus === "En Route to Pickup") &&
        driverLocation &&
        pickupLocation
      ) {
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
        newBounds.push([
          pickupLocation.coordinates[0],
          pickupLocation.coordinates[1],
        ]);
      } else if (
        bookingStatus === "Picked Up" &&
        driverLocation &&
        dropoffLocation
      ) {
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
        newBounds.push([
          dropoffLocation.coordinates[0],
          dropoffLocation.coordinates[1],
        ]);
      } else if (driverLocation) {
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
      }
    }

    setBounds(newBounds);
  }, [
    role,
    bookingStatus,
    userLocation,
    driverLocation,
    pickupLocation,
    dropoffLocation,
  ]);

  return (
    <MapContainer
      center={
        role === "driver" && driverLocation
          ? [driverLocation.latitude, driverLocation.longitude]
          : [0, 0]
      }
      zoom={13}
      className="h-full w-full"
      whenCreated={(map) => {
        if (bounds.length > 0) {
          const leafletBounds = L.latLngBounds(bounds);
          map.fitBounds(leafletBounds, { padding: [50, 50] });
        }
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Markers based on role and booking status */}
      {role === "driver" && driverLocation && (
        <Marker position={[driverLocation.latitude, driverLocation.longitude]}>
          <Popup>Your Current Location</Popup>
        </Marker>
      )}

      {role === "user" && userLocation && (
        <Marker position={[userLocation.latitude, userLocation.longitude]}>
          <Popup>Your Current Location</Popup>
        </Marker>
      )}

      {/* Pickup Location Marker */}
      {role === "driver" &&
        (bookingStatus === "Driver Assigned" ||
          bookingStatus === "En Route to Pickup") &&
        pickupLocation && (
          <Marker
            position={[
              pickupLocation.coordinates[0],
              pickupLocation.coordinates[1],
            ]}
          >
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

      {/* Drop-off Location Marker */}
      {role === "driver" &&
        (bookingStatus === "Goods Collected" ||
          bookingStatus === "In Transit") &&
        dropoffLocation && (
          <Marker
            position={[
              dropoffLocation.coordinates[0],
              dropoffLocation.coordinates[1],
            ]}
          >
            <Popup>Drop-off Location</Popup>
          </Marker>
        )}

      {/* Route Polyline */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline positions={routeCoordinates} color="blue" />
      )}

      {/* Adjust map bounds */}
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
  bookingStatus: PropTypes.string,
  routeCoordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
};

MapView.defaultProps = {
  userLocation: null,
  driverLocation: null,
  pickupLocation: null,
  dropoffLocation: null,
  bookingStatus: null,
  routeCoordinates: [],
};

export default MapView;
