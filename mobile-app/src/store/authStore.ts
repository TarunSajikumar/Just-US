import { storageService } from '../services/storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// ─── Secure Storage Helpers ────────────────────────────────────────────────

export const saveAuthData = async (token: string, user: any) => {
  try {
    await storageService.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
  } catch (e) {
    console.error('Error saving auth data', e);
  }
};

export const getAuthData = async () => {
  try {
    const token = await storageService.getItem('userToken');
    const userStr = await AsyncStorage.getItem('userData');
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  } catch (e) {
    console.error('Error getting auth data', e);
    return null;
  }
};

export const clearAuthData = async () => {
  try {
    await storageService.deleteItem('userToken');
    await AsyncStorage.removeItem('userData');
  } catch (e) {
    console.error('Error clearing auth data', e);
  }
};

// ─── Auth Zustand Store ────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  user: any | null;
  partner: any | null;
  relationshipStartDate: string | null;
  anniversaryDate: string | null;
  nextMeetDate: string | null;
  partnerNickname: string;
  partnerPingMessage: string;
  notificationsEnabled: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
  setPartner: (partner: any | null) => void;
  setRelationshipStartDate: (date: string | null) => void;
  setAnniversaryDate: (date: string | null) => void;
  setNextMeetDate: (date: string | null) => void;
  setPartnerNickname: (nickname: string) => void;
  setPartnerPingMessage: (message: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  partner: null,
  relationshipStartDate: null,
  anniversaryDate: null,
  nextMeetDate: null,
  partnerNickname: '',
  partnerPingMessage: 'I miss you, where are you? ❤️',
  notificationsEnabled: false,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setPartner: (partner) => set({ partner }),
  setRelationshipStartDate: (relationshipStartDate) => set({ relationshipStartDate }),
  setAnniversaryDate: (anniversaryDate) => set({ anniversaryDate }),
  setNextMeetDate: (nextMeetDate) => set({ nextMeetDate }),
  setPartnerNickname: (partnerNickname) => set({ partnerNickname }),
  setPartnerPingMessage: (partnerPingMessage) => set({ partnerPingMessage }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  logout: () => {
    set({
      token: null,
      user: null,
      partner: null,
      relationshipStartDate: null,
      anniversaryDate: null,
      nextMeetDate: null,
      partnerNickname: '',
      partnerPingMessage: 'I miss you, where are you? ❤️',
      notificationsEnabled: false,
    });
  },
}));
