// src/services/routingService.js

import {LocalConvenienceStoreOutlined} from '@mui/icons-material';
import axios from 'axios';

// Replace with your actual Mapbox Access Token
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'sk.eyJ1IjoiYWthc2hrdW1hcjc5MDIiLCJhIjoiY20yZGFiNXYzMWI3dzJqcjI2NzRrcmF5ZyJ9.8d1Ub4RFmIJStFo2XYLlcg';

// Base URL for Mapbox Directions API
const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

const getRoute = async (start, end) => {
    console.log(start, end);
  try {
    const coordinates = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
    const response = await axios.get(`${DIRECTIONS_URL}/${coordinates}`, {
      params: {
        alternatives: false,
        geometries: 'geojson',
        steps: false,
        access_token: MAPBOX_ACCESS_TOKEN,
      },
    });

    // Extract the route geometry
    const route = response.data.routes[0];
    const geometry = route.geometry;

    // Mapbox provides coordinates in [longitude, latitude] format
    // Convert them to [latitude, longitude] for Leaflet
    const routeCoordinates = geometry.coordinates.map(coord => [coord[1], coord[0]]);

    return routeCoordinates;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

export default {
  getRoute,
};
