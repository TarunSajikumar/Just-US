import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  registerForPushNotificationsAsync: async () => {
    // 1. Skip if on web
    if (Platform.OS === 'web') return;

    // 2. Skip if not a physical device (Emulators don't support push well)
    if (!Device.isDevice) {
      console.log('Skipping push notifications: Not a physical device');
      return;
    }

    // 3. Handle Expo Go limitations
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.expoVersion === null;
    if (isExpoGo) {
      console.log('Push notifications: Expo Go detected. Some features like notification channels are disabled to prevent crashes.');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permissions denied');
      return;
    }

    let token;
    try {
      if (!isExpoGo) {
        token = (await Notifications.getDevicePushTokenAsync()).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } catch (e) {
      // Only log if we're on a physical device, otherwise it's expected
      if (Device.isDevice) {
        console.log("Could not get push token:", e);
      }
    }

    // ONLY set notification channel if NOT in Expo Go
    // Expo Go has a known bug/limitation with setNotificationChannelAsync on some Android versions
    if (Platform.OS === 'android' && !isExpoGo) {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (e) {
        console.log("Error setting notification channel:", e);
      }
    }

    return token;
  },

  sendMissYouPing: async (customMessage?: string) => {
    const response = await api.post('/notifications/miss-you', { customMessage });
    return response.data;
  },
  sendIntimateQuestion: async (question: string) => {
    const response = await api.post('/notifications/intimate-question', { question });
    return response.data;
  },
  sendDateIdea: async (idea: string) => {
    const response = await api.post('/notifications/date-idea', { idea });
    return response.data;
  },
  sendPing: async (customMessage: string) => {
    const response = await api.post('/notifications/miss-you', { customMessage });
    return response.data;
  },
  sendQuickMessage: async (message: string) => {
    const response = await api.post('/notifications/miss-you', { customMessage: message });
    return response.data;
  },
  sendQuestionAnswer: async (question: string, answer: string) => {
    const response = await api.post('/notifications/question-answer', { question, answer });
    return response.data;
  }
};

export const registerForPushNotificationsAsync = notificationService.registerForPushNotificationsAsync;
