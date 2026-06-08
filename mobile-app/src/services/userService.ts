import { api } from './api';

export const userService = {
  /** PUT /api/users/partner-nickname */
  updatePartnerNickname: async (nickname: string) => {
    const response = await api.put('/users/partner-nickname', { nickname });
    return response.data;
  },

  /** PUT /api/users/ping-message */
  updatePingMessage: async (message: string) => {
    const response = await api.put('/users/ping-message', { message });
    return response.data;
  },

  /** PUT /api/users/fcm-token */
  updateFcmToken: async (token: string) => {
    const response = await api.put('/users/fcm-token', { token });
    return response.data;
  },

  /** PUT /api/users/notifications */
  updateNotificationSettings: async (enabled: boolean) => {
    const response = await api.put('/users/notifications', { enabled });
    return response.data;
  },

  /** GET /api/users/preferences */
  getPreferences: async () => {
    const response = await api.get('/users/preferences');
    return response.data;
  },

  /** PUT /api/users/preferences */
  updatePreferences: async (prefs: { language?: string; fontSize?: string; quickLoveNotifications?: boolean }) => {
    const response = await api.put('/users/preferences', prefs);
    return response.data;
  },

  /** GET /api/users/export */
  exportUserData: async () => {
    const response = await api.get('/users/export');
    return response.data;
  },
};
