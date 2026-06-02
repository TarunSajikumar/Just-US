import axios from "axios";
import { storageService } from './storageService';
import { useAuthStore } from '../store/authStore';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL!;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for adding token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await storageService.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    if (status === 401 || (status === 404 && url?.includes('/auth/me'))) {
      // Token expired, invalid, or user record deleted from database
      await storageService.deleteItem('userToken');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
