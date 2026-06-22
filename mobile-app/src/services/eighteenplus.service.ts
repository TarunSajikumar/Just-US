import { api } from './api';

export interface EighteenPlusConsent {
  _id: string;
  coupleId: string;
  requester: {
    userId: string;
    requestedAt: string;
    message: string;
  };
  responder: {
    userId: string;
    status: 'pending' | 'accepted' | 'rejected';
    respondedAt: string | null;
    message: string;
  };
  overallStatus: 'not_requested' | 'pending' | 'accepted' | 'rejected' | 'revoked';
  activatedAt: string | null;
  revokedBy: {
    userId: string | null;
    revokedAt: string | null;
    reason: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const eighteenPlusService = {
  /**
   * Request 18+ mode from partner
   */
  requestMode: async (message: string = '') => {
    const response = await api.post('/18plus/request', { message });
    return response.data as { success: boolean; consent: EighteenPlusConsent };
  },

  /**
   * Accept 18+ mode request
   */
  acceptMode: async () => {
    const response = await api.post('/18plus/accept', {});
    return response.data as { success: boolean; consent: EighteenPlusConsent };
  },

  /**
   * Reject 18+ mode request
   */
  rejectMode: async (reason: string = '') => {
    const response = await api.post('/18plus/reject', { reason });
    return response.data as { success: boolean; consent: EighteenPlusConsent };
  },

  /**
   * Revoke 18+ mode (by either partner)
   */
  revokeMode: async (reason: string = '') => {
    const response = await api.post('/18plus/revoke', { reason });
    return response.data as { success: boolean; consent: EighteenPlusConsent };
  },

  /**
   * Get current 18+ mode status
   */
  getStatus: async () => {
    const response = await api.get('/18plus/status');
    return response.data as {
      status: 'not_requested' | 'pending' | 'accepted' | 'rejected' | 'revoked';
      consent: EighteenPlusConsent | null;
    };
  },
};
