import axios from "axios";
import { storageService } from './storageService';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// Determine the API base URL dynamically for development
const getDevApiUrl = (): string => {
  try {
    // Priority 1: Use EXPO_PUBLIC_API_URL_DEV if it's explicitly set to something other than localhost
    const envDevUrl = process.env.EXPO_PUBLIC_API_URL_DEV;
    if (envDevUrl && typeof envDevUrl === 'string' && !envDevUrl.includes('localhost') && !envDevUrl.includes('127.0.0.1')) {
      console.log(`📱 Using explicitly configured DEV API URL: ${envDevUrl}`);
      return envDevUrl;
    }

    // Priority 2: Emulator / Simulator fallback
    if (Device && !Device.isDevice) {
      if (Platform.OS === 'android') {
        console.log(`📱 Running on Android Emulator. Using 10.0.2.2 loopback IP.`);
        return 'http://10.0.2.2:5000/api';
      } else {
        console.log(`📱 Running on iOS Simulator / Web. Using localhost.`);
        return 'http://localhost:5000/api';
      }
    }

    // Priority 3: Physical Device - use localhost via ADB reverse tunnel (port 5000 is forwarded)
    if (Platform.OS === 'android') {
      console.log(`📱 Running on Physical Android Device. Using localhost via ADB reverse tunnel.`);
      return 'http://localhost:5000/api';
    }

    // Priority 4: Try to resolve developer machine's IP dynamically from Expo CLI
    const hostUri = Constants?.expoConfig?.hostUri || (Constants?.manifest as any)?.hostUri;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      const resolvedUrl = `http://${hostIp}:5000/api`;
      console.log(`📱 Running on Physical Device. Dynamically resolved host IP: ${resolvedUrl}`);
      return resolvedUrl;
    }

    // Priority 5: Fallback to environment or default local IP
    const fallback = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.82:5000/api';
    console.log(`📱 Fallback to API URL: ${fallback}`);
    return fallback;
  } catch (error) {
    console.error("❌ Error in getDevApiUrl:", error);
    return 'http://10.0.2.2:5000/api'; // Most common fallback for local dev
  }
};

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const BASE_URL = isDev
  ? getDevApiUrl()
  : process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api';

console.log(`🌐 HTTP BASE_URL: ${BASE_URL}`);

// Render free tier can take 30-60s to cold-start — use a generous timeout
// Reduced from 120s since we fixed SMTP email sending
const REQUEST_TIMEOUT = 30000; // 30 seconds

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug interceptors
http.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() || 'UNKNOWN';
  const url = `${config.baseURL || ''}${config.url || ''}`;
  console.log(
    `🔵 REQUEST: ${method} ${url}`
  );
  return config;
});

http.interceptors.response.use(
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
        // Note: We don't import useAuthStore here to avoid circular dependency
        // The logout will be handled by the component/hook that called this
      }
    } else if (error.request) {
      console.log(`⚠️ NO RESPONSE:`, error.request);
    } else {
      console.log(`🔴 ERROR:`, error.message);
    }

    return Promise.reject(error);
  }
);
