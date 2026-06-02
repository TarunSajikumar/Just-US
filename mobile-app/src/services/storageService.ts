import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cross-platform storage service that uses:
 * - SecureStore on native platforms (iOS, Android)
 * - AsyncStorage on web (expo-secure-store is not available on web)
 */

// Lazily load SecureStore only on native to avoid web bundle errors
const getSecureStore = () => {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-secure-store') as typeof import('expo-secure-store');
  }
  return null;
};

export const storageService = {
  /**
   * Get a value from storage
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      const SecureStore = getSecureStore()!;
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  },

  /**
   * Set a value in storage
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        const SecureStore = getSecureStore()!;
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  },

  /**
   * Delete a value from storage
   */
  deleteItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        const SecureStore = getSecureStore()!;
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error deleting ${key} from storage:`, error);
    }
  },
};

