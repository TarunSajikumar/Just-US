import axios from "axios";
import { storageService } from './storageService';
import { useAuthStore } from '../store/authStore';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL!;

// Request timeout configuration
const REQUEST_TIMEOUT = 15000; // 15 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug interceptors
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() || 'UNKNOWN';
  const url = config.baseURL + config.url;
  console.log(
    `🔵 REQUEST: ${method} ${url}`
  );
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`✅ RESPONSE: ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.log(`❌ ERROR: ${error.response.status} - ${error.response.statusText}`);
      console.log(`📝 ERROR DATA:`, error.response.data);
    } else if (error.request) {
      console.log(`❌ NO RESPONSE: Request made but no response received`);
      console.log(`📡 Possible causes: Network error, timeout, or server unreachable`);
    } else {
      console.log(`❌ ERROR:`, error.message);
    }
    return Promise.reject(error);
  }
);

// Interceptor for adding token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await storageService.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔐 Token added to request`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for handling errors (like 401 Unauthorized or 404 Not Found for profile)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response ? error.response.status : null;
    const url = error.config ? error.config.url : '';

    console.log(`🔍 Analyzing error: Status ${status}, URL: ${url}`);

    if (status === 401 || (status === 404 && url?.includes('/auth/me'))) {
      // Token expired, invalid, or user record deleted from database
      console.log(`🚪 Logging out user due to ${status === 401 ? 'unauthorized' : '404'} response`);
      await storageService.deleteItem('userToken');
      useAuthStore.getState().logout();
    }

    // Enhanced error messages
    if (!error.response) {
      // Network error or timeout
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check your internet connection.';
      } else if (error.message === 'Network Error') {
        error.message = 'Network error. Please check your internet connection and try again.';
      } else {
        error.message = error.message || 'Network connection failed';
      }
    }

    return Promise.reject(error);
  }
);
