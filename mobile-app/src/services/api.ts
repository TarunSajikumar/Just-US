import { http, BASE_URL } from './http';
import { storageService } from './storageService';

console.log(`📱 API BASE_URL: ${BASE_URL}`);

// Re-export http as api for backward compatibility
export const api = http;
export { BASE_URL };

// Add auth token to all requests
http.interceptors.request.use(async (config) => {
  const token = await storageService.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`🔐 Token added to request`);
  }
  return config;
});

// Handle logout on 401 — use lazy import to avoid circular dependency
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log(`🚪 Logging out user due to unauthorized response`);
      await storageService.deleteItem('userToken');
      // Lazy import to break circular dependency
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

