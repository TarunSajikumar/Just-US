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
  login: async (data: { email?: string; password?: string; contact?: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  sendOtp: async (contact: string) => {
    const response = await api.post('/auth/send-otp', { contact });
    return response.data;
  },

  verifySignup: async (data: { contact?: string; email?: string; otp: string }) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  updateRelationshipDate: async (data: { relationshipStartDate?: string; anniversaryDate?: string; nextMeetDate?: string; }) => {
    const response = await api.put('/auth/relationship-date', data);
    return response.data;
  },

  /** POST /api/auth/signup → { message } - Step 1: Send OTP */
  signup: async (data: { name: string; email: string }) => {
    try {
      console.log('Sending signup request:', data);
      const response = await api.post('/auth/signup', data);
      console.log('Signup response:', response.data);
      return response.data;
    } catch (error: any) {
      console.log('SIGNUP ERROR');
      console.log(error);
      console.log(error?.response?.data);
      throw error;
    }
  },

  /** POST /api/auth/verify-email-otp → { success, message } - Step 2: Verify email OTP */
  verifyEmailOtp: async (data: { email: string; otp: string }) => {
    const response = await api.post('/auth/verify-email-otp', data);
    return response.data;
  },

  /** POST /api/auth/register → { success, token, user } - Step 3: Create account with password */
  register: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /** POST /api/auth/forgot-password → { message } - Step 1: Send reset OTP */
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /** POST /api/auth/verify-reset-otp → { success, message } - Step 2: Verify reset OTP */
  verifyResetOtp: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-reset-otp', { email, otp });
    return response.data;
  },

  /** POST /api/auth/reset-password → { success, message } - Step 3: Update password */
  resetPassword: async (data: { email?: string; newPassword: string; resetToken?: string }) => {
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

  resetStatus: async () => {
    const response = await api.post('/users/reset-status');
    return response.data;
  },

  logout: async () => {
    await clearAuthData();
    useAuthStore.getState().logout();
  },
};
