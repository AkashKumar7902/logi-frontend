import axios from 'axios';
import { mapboxToken } from '../config';

const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

const getRoute = async (start, end) => {
  if (!mapboxToken) {
    return null;
  }

  try {
    const coordinates = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
    const response = await axios.get(`${DIRECTIONS_URL}/${coordinates}`, {
      params: {
        alternatives: false,
        geometries: 'geojson',
        steps: false,
        access_token: mapboxToken,
      },
    });

    const route = response.data.routes[0];
    if (!route || !route.geometry || !route.geometry.coordinates) {
      return null;
    }

    return route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

const routingService = {
  getRoute,
};

export default routingService;
