import { api } from './api';

export const heartService = {
  /**
   * Add or toggle a heart reaction to a message
   */
  addHeart: async (messageId: string, heartType: string = 'heart') => {
    const response = await api.post('/hearts/add', {
      messageId,
      heartType,
    });
    return response.data;
  },

  /**
   * Remove heart reaction from a message
   */
  removeHeart: async (messageId: string) => {
    const response = await api.delete(`/hearts/${messageId}`);
    return response.data;
  },

  /**
   * Get all heart reactions for a message
   */
  getMessageHearts: async (messageId: string) => {
    const response = await api.get(`/hearts/${messageId}`);
    return response.data;
  },

  /**
   * Get heart count for a message
   */
  getHeartCount: async (messageId: string) => {
    const response = await api.get(`/hearts/count/${messageId}`);
    return response.data;
  },
};
