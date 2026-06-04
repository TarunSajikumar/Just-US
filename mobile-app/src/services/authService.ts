import { api } from './api';
import { clearAuthData, saveAuthData } from '../store/authStore';
import { useAuthStore } from '../store/authStore';

export const authService = {
  /** Helper to update Zustand store with user profile data */
  updateStoreWithProfile: async (profile: any) => {
    const {
      setUser,
      setPartner,
      setRelationshipStartDate,
      setAnniversaryDate,
      setNextMeetDate,
      setPartnerNickname,
      setPartnerPingMessage,
      setNotificationsEnabled,
      token,
    } = useAuthStore.getState();

    setUser(profile);
    setPartner(profile.partner ?? null);
    setRelationshipStartDate(profile.relationshipStartDate ?? null);
    setAnniversaryDate(profile.anniversaryDate ?? null);
    setNextMeetDate(profile.nextMeetDate ?? null);
    setPartnerNickname(profile.partnerNickname ?? '');
    setPartnerPingMessage(profile.partnerPingMessage ?? 'I miss you, where are you? ❤️');
    setNotificationsEnabled(profile.notificationsEnabled ?? false);

    // Persist to local storage
    if (token) {
      await saveAuthData(token, profile);
    }
  },

  /** POST /api/auth/login → { success, token, user } */
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  /** POST /api/auth/signup → { message } */
  signup: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  /** POST /api/auth/verify-signup → { success, token, user } */
  verifySignup: async (data: { email: string; otp: string }) => {
    const response = await api.post('/auth/verify-signup', data);
    return response.data;
  },

  /** POST /api/auth/forgot-password → { message } */
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /** POST /api/auth/verify-reset-otp → { success, resetToken } */
  verifyResetOtp: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-reset-otp', { email, otp });
    return response.data;
  },

  /** POST /api/auth/reset-password → { success, message } */
  resetPassword: async (data: { resetToken: string; newPassword: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  /** PUT /api/auth/profile */
  completeProfile: async (data: { fullName: string; dob?: string; gender?: string }) => {
    const response = await api.put('/auth/profile', {
      name: data.fullName,
      birthday: data.dob,
      gender: data.gender,
    });
    return response.data;
  },

  /** GET /api/auth/me */
  me: async () => {
    const response = await api.get('/auth/me');
    const profile = response.data;
    await authService.updateStoreWithProfile(profile);
    return profile;
  },

  logout: async () => {
    await clearAuthData();
    useAuthStore.getState().logout();
  },
};
