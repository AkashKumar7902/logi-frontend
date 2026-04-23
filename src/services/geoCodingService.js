import axios from 'axios';
import { mapboxToken } from '../config';

const GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

const getPlaceName = async (latitude, longitude) => {
  if (!mapboxToken) {
    return 'Unknown Location';
  }

  try {
    const response = await axios.get(`${GEOCODING_URL}/${longitude},${latitude}.json`, {
      params: {
        access_token: mapboxToken,
        types: 'place,poi,address',
        limit: 1,
      },
    });

    if (response.data.features && response.data.features.length > 0) {
      return response.data.features[0].place_name;
    }
    return 'Unknown Location';
  } catch (error) {
    console.error('Error fetching place name:', error);
    return 'Unknown Location';
  }
};

const geoCodingService = {
  getPlaceName,
};

export default geoCodingService;
