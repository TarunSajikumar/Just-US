import * as admin from 'firebase-admin';

// Initialize Firebase Admin
// This expects FIREBASE_SERVICE_ACCOUNT_JSON env variable to be present
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully ❤️");
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT_JSON not found. Push notifications will be disabled.");
}

export const sendPushNotification = async (token: string, title: string, body: string, data?: any) => {
  if (!admin.apps.length) return;

  try {
    const message = {
      notification: {
        title,
        body,
      },
      token,
      data: data || {},
      android: {
        priority: 'high' as 'high',
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    await admin.messaging().send(message);
    console.log(`Push notification sent to ${token}`);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};
