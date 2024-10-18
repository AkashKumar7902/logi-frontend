// src/services/geocodingService.js

import axios from 'axios';

// Replace with your actual Mapbox Access Token
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'sk.eyJ1IjoiYWthc2hrdW1hcjc5MDIiLCJhIjoiY20yZGFiNXYzMWI3dzJqcjI2NzRrcmF5ZyJ9.8d1Ub4RFmIJStFo2XYLlcg';

// Base URL for Mapbox Geocoding API
const GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

const getPlaceName = async (latitude, longitude) => {
  try {
    const response = await axios.get(`${GEOCODING_URL}/${longitude},${latitude}.json`, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        types: 'place,poi,address',
        limit: 1,
      },
    });

    if (
      response.data.features &&
      response.data.features.length > 0
    ) {
      return response.data.features[0].place_name;
    } else {
      return 'Unknown Location';
    }
  } catch (error) {
    console.error('Error fetching place name:', error);
    return 'Unknown Location';
  }
};

export default {
  getPlaceName,
};
