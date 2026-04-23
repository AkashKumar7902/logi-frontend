const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const env = import.meta.env;

const readEnv = (...keys) => {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return '';
};

const apiBaseURL = trimTrailingSlash(
  readEnv('VITE_API_BASE_URL', 'REACT_APP_API_BASE_URL') || 'http://localhost:8080'
);

const wsBaseURL = trimTrailingSlash(
  readEnv('VITE_WS_BASE_URL', 'REACT_APP_WS_BASE_URL') || apiBaseURL.replace(/^http/i, 'ws')
);

const mapboxToken = readEnv('VITE_MAPBOX_ACCESS_TOKEN', 'REACT_APP_MAPBOX_ACCESS_TOKEN');

export { apiBaseURL, wsBaseURL, mapboxToken };
