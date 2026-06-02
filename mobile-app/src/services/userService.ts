import { api } from './api';

export const userService = {
  /** PUT /api/users/partner-nickname */
  updatePartnerNickname: async (nickname: string) => {
    const response = await api.put('/users/partner-nickname', {
      nickname,
    });
    return response.data;
  },

  /** PUT /api/users/ping-message */
  updatePingMessage: async (message: string) => {
    const response = await api.put('/users/ping-message', {
      message,
    });
    return response.data;
  },

  /** PUT /api/users/fcm-token */
  updateFcmToken: async (token: string) => {
    const response = await api.put('/users/fcm-token', {
      token,
    });
    return response.data;
  },

  /** PUT /api/users/notifications */
  updateNotificationSettings: async (enabled: boolean) => {
    const response = await api.put('/users/notifications', {
      enabled,
    });
    return response.data;
  },
};
