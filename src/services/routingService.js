// src/services/routingService.js

import axios from 'axios';

// Replace with your actual OpenRouteService API key
const OPEN_ROUTE_SERVICE_API_KEY = '5b3ce3597851110001cf624822d6989b68c840939e6bce6b32bc6f15';

// Base URL for OpenRouteService Directions API
const DIRECTIONS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

const getRoute = async (start, end) => {
  try {
    const response = await axios.post(
      DIRECTIONS_URL,
      {
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude],
        ],
      },
      {
        headers: {
          'Authorization': OPEN_ROUTE_SERVICE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract the route geometry
    const geometry = response.data.features[0].geometry;
    return geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert to [lat, lng]
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

export default {
  getRoute,
};
