import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userService } from './user.service';

/**
 * Initialize Expo notifications
 * Must be called on app startup
 */
export async function initializeNotifications() {
  if (!Device.isDevice) {
    console.warn('Must use physical device for notifications');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Get FCM token (Android) or APNS token (iOS)
    const token = await getFCMToken();
    return token;
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return null;
  }
}

/**
 * Get FCM token for the device
 */
async function getFCMToken() {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error('Project ID not found in expo config');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('FCM Token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Register device token with backend
 */
export async function registerDeviceToken(token: string) {
  try {
    await userService.updateFcmToken(token);
    console.log('Device token registered successfully');
  } catch (error) {
    console.error('Failed to register device token:', error);
  }
}

/**
 * Setup notification handlers for different states
 */
export function setupNotificationHandlers() {
  // Handle notifications received while app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('Notification received in foreground:', notification);

      // Return config for how to handle notification
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });

  // Handle notification response (user tap)
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    }
  );

  return subscription;
}

/**
 * Handle notification tap/response
 * Navigate to relevant screen based on notification type
 */
function handleNotificationResponse(data: any) {
  const { notificationType, targetId, targetScreen } = data;

  // This will be called from your navigation context
  // Example:
  if (targetScreen) {
    console.log('Navigating to:', targetScreen, 'with data:', data);
    // navigation.navigate(targetScreen, { data });
  }
}

/**
 * Check if app was launched from notification
 */
export async function checkInitialNotification() {
  try {
    const notification = await Notifications.getLastNotificationResponseAsync();
    return notification?.notification.request.content.data;
  } catch (error) {
    console.error('Failed to get initial notification:', error);
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Schedule local notification (for testing or offline reminders)
 */
export async function scheduleNotification(
  title: string,
  body: string,
  trigger?: Notifications.NotificationTrigger,
  data?: any
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
      },
      trigger: trigger || { seconds: 2 },
    });
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
}

/**
 * Schedule period reminders (if enabled)
 */
export async function schedulePeriodReminders(periodDates: any) {
  try {
    // Schedule period starting reminder
    const nextPeriodDate = new Date(periodDates.nextPeriodDate);
    const reminderDate = new Date(nextPeriodDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // Notify 1 day before

    await scheduleNotification(
      'Period Reminder ❤️',
      'Your period may start tomorrow',
      {
        type: 'date',
        date: reminderDate,
      },
      { notificationType: 'period_reminder', type: 'period_starting' }
    );

    console.log('Period reminders scheduled');
  } catch (error) {
    console.error('Failed to schedule period reminders:', error);
  }
}

export const notificationService = {
  initializeNotifications,
  registerDeviceToken,
  setupNotificationHandlers,
  checkInitialNotification,
  requestNotificationPermission,
  scheduleNotification,
  schedulePeriodReminders,
};
