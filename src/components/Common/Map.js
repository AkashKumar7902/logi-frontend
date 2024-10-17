// src/components/Common/Map.js

import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

function MapComponent({ pickupLocation, dropoffLocation, driverLocation }) {
  const [directionsResponse, setDirectionsResponse] = useState(null);

  useEffect(() => {
    calculateRoute();
  }, [pickupLocation, dropoffLocation]);

  const calculateRoute = async () => {
    if (!pickupLocation || !dropoffLocation) return;

    const directionsService = new window.google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: pickupLocation.address,
      destination: dropoffLocation.address,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
  };

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center = pickupLocation
    ? { lat: pickupLocation.coordinates[1], lng: pickupLocation.coordinates[0] }
    : { lat: 0, lng: 0 };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
      >
        {directionsResponse && (
          <DirectionsRenderer directions={directionsResponse} />
        )}
        {driverLocation && (
          <Marker
            position={{
              lat: driverLocation.coordinates[1],
              lng: driverLocation.coordinates[0],
            }}
            icon={{
              url: "../dei.png", // Path to driver icon image
              scaledSize: new window.google.maps.Size(50, 50),
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default MapComponent;
