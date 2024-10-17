// src/components/Map/MapView.js

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import routingService from '../../services/routingService';
import { toast } from 'react-toastify';

// Fix Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});

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
  role = 'user', // 'user' or 'driver'
  userLocation = null,
  driverLocation = null,
  pickupLocation = null,
  dropoffLocation = null,
  bookingStatus = null, // e.g., 'Driver Assigned', 'In Transit'
}) => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [bounds, setBounds] = useState([]);

  useEffect(() => {
    // Determine which locations to include in bounds
    const newBounds = [];

    if (role === 'user') {
      if (bookingStatus === 'Driver Assigned' && userLocation && driverLocation) {
        newBounds.push([userLocation.latitude, userLocation.longitude]);
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
        fetchRoute(userLocation, driverLocation);
      } else if (bookingStatus === 'In Transit' && driverLocation && dropoffLocation) {
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
        newBounds.push([dropoffLocation.latitude, dropoffLocation.longitude]);
        fetchRoute(driverLocation, dropoffLocation);
      } else if (userLocation) {
        newBounds.push([userLocation.latitude, userLocation.longitude]);
      }
    }

    if (role === 'driver') {
      if (bookingStatus === 'Accepted' && pickupLocation && driverLocation) {
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
        newBounds.push([pickupLocation.latitude, pickupLocation.longitude]);
        fetchRoute(driverLocation, pickupLocation);
      } else if (bookingStatus === 'Picked Up' && driverLocation && dropoffLocation) {
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
        newBounds.push([dropoffLocation.latitude, dropoffLocation.longitude]);
        fetchRoute(driverLocation, dropoffLocation);
      } else if (driverLocation) {
        newBounds.push([driverLocation.latitude, driverLocation.longitude]);
      }
    }

    setBounds(newBounds);
  }, [role, bookingStatus, userLocation, driverLocation, pickupLocation, dropoffLocation]);

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

  return (
    <MapContainer
      center={role === 'user' && userLocation ? [userLocation.latitude, userLocation.longitude] : [0, 0]}
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
      {role === 'user' && userLocation && bookingStatus !== 'In Transit' && (
        <Marker position={[userLocation.latitude, userLocation.longitude]}>
          <Popup>Your Current Location</Popup>
        </Marker>
      )}

      {role === 'user' && bookingStatus === 'In Transit' && dropoffLocation && (
        <Marker position={[dropoffLocation.latitude, dropoffLocation.longitude]}>
          <Popup>Drop-off Location</Popup>
        </Marker>
      )}

      {role === 'driver' && (
        <Marker position={[driverLocation.latitude, driverLocation.longitude]}>
          <Popup>Your Current Location</Popup>
        </Marker>
      )}

      {/* Driver Location Marker for User */}
      {role === 'user' && bookingStatus === 'Driver Assigned' && driverLocation && (
        <Marker position={[driverLocation.latitude, driverLocation.longitude]}>
          <Popup>Driver Location</Popup>
        </Marker>
      )}

      {/* Pickup Location Marker for Driver */}
      {role === 'driver' && bookingStatus === 'Accepted' && pickupLocation && (
        <Marker position={[pickupLocation.latitude, pickupLocation.longitude]}>
          <Popup>Pickup Location</Popup>
        </Marker>
      )}

      {/* Drop-off Location Marker for Driver */}
      {role === 'driver' && bookingStatus === 'Picked Up' && dropoffLocation && (
        <Marker position={[dropoffLocation.latitude, dropoffLocation.longitude]}>
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

export default MapView;
