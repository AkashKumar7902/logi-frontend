import axios from 'axios';
import { apiBaseURL } from '../config';

export const AUTH_EXPIRED_EVENT = 'logi:auth-expired';

const api = axios.create({
  baseURL: apiBaseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if ((status === 401 || status === 403) && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback = 'Request failed') =>
  error?.response?.data?.error || error?.message || fallback;

export default api;
