import { api } from './api';

export interface AppLockSettings {
  isLockEnabled: boolean;
  lockType: 'pin' | 'biometric';
  biometricEnabled: boolean;
  biometricType?: 'fingerprint' | 'faceId' | 'iris';
  lockOnAppStart: boolean;
  lockOnAppBackground: boolean;
  lockTimeoutMinutes: number;
}

export const appLockService = {
  /**
   * Setup app lock with PIN or biometric
   */
  setupLock: async (
    lockType: 'pin' | 'biometric',
    pin?: string,
    biometricType?: string,
    lockOnAppStart: boolean = true,
    lockOnAppBackground: boolean = true
  ) => {
    const response = await api.post('/applock/setup', {
      lockType,
      pin,
      biometricType,
      lockOnAppStart,
      lockOnAppBackground,
    });
    return response.data as {
      success: boolean;
      settings: AppLockSettings;
    };
  },

  /**
   * Verify PIN or biometric
   */
  verifyLock: async (pin?: string, biometric?: string) => {
    const response = await api.post('/applock/verify', {
      pin,
      biometric,
    });
    return response.data as { success: boolean };
  },

  /**
   * Get current app lock settings
   */
  getSettings: async () => {
    const response = await api.get('/applock/settings');
    return response.data as AppLockSettings;
  },

  /**
   * Change PIN
   */
  changePin: async (oldPin: string, newPin: string) => {
    const response = await api.put('/applock/change-pin', {
      oldPin,
      newPin,
    });
    return response.data as { success: boolean };
  },

  /**
   * Toggle app lock on/off
   */
  toggleLock: async (enabled: boolean) => {
    const response = await api.put('/applock/toggle', { enabled });
    return response.data as { success: boolean; isLockEnabled: boolean };
  },

  /**
   * Remove app lock completely
   */
  removeLock: async () => {
    const response = await api.delete('/applock/remove');
    return response.data as { success: boolean };
  },
};
