import axios from "axios";
import { storageService } from './storageService';
import { useAuthStore } from '../store/authStore';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL!;

// Render free tier can take 30-60s to cold-start — use a generous timeout
const REQUEST_TIMEOUT = 60000; // 60 seconds

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
  const url = `${config.baseURL || ''}${config.url || ''}`;
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
  async (error) => {
    const status = error.response ? error.response.status : null;
    const url = error.config ? error.config.url : '';

    if (error.response) {
      console.log(`❌ ERROR: ${error.response.status} - ${error.response.statusText}`);
      console.log(`📝 ERROR DATA:`, error.response.data);

      // Handle logout on 401 or 404 for /auth/me
      if (status === 401 || (status === 404 && url?.includes('/auth/me'))) {
        console.log(`🚪 Logging out user due to ${status === 401 ? 'unauthorized' : '404'} response`);
        await storageService.deleteItem('userToken');
        useAuthStore.getState().logout();
      }
    } else if (error.request) {
      console.log(`❌ NO RESPONSE: Request made but no response received`);
      console.log(`📡 Possible causes: Network error, timeout, or server unreachable`);
      console.log(`URL: ${url}`);

      // Enhanced error messages for network issues
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Server took too long to respond. Please check your connection.';
      } else if (error.message === 'Network Error') {
        error.message = 'Network error. Please check your internet connection.';
      } else {
        error.message = 'Unable to connect to server. Please check your internet connection and try again.';
      }
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
// This is now consolidated into the response interceptor above

