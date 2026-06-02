import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginSignupScreen from '../screens/auth/LoginSignupScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import SignupDetailsScreen from '../screens/auth/SignupDetailsScreen';
import RelationshipSetupScreen from '../screens/auth/RelationshipSetupScreen';

// Authenticated tabs
import SoloTabs from './SoloTabs';
import CoupleTabs from './CoupleTabs';
import EditRelationshipDateScreen from '../screens/couple/EditRelationshipDateScreen';
import AchievementsScreen from '../screens/couple/AchievementsScreen';

// Store + services
import { useAuthStore, getAuthData } from '../store/authStore';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';

const Stack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="LoginSignup" component={LoginSignupScreen} />
      <Stack.Screen name="OTP" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { token, user, setToken, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = React.useRef<any>(null);

  useEffect(() => {
    const setupNotifications = async () => {
      if (token) {
        try {
          const fcmToken = await notificationService.registerForPushNotificationsAsync();
          if (fcmToken) {
            await userService.updateFcmToken(fcmToken);
          }
        } catch (e) {
          console.log("Notification setup skipped or failed:", e);
        }
      }
    };

    setupNotifications();
  }, [token]);

  // Reset navigation when user logs out
  useEffect(() => {
    if (!token) {
      console.log('Token cleared, resetting navigation to LoginSignup');
      if (navigationRef.current) {
        setTimeout(() => {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: 'LoginSignup' }],
          });
        }, 100);
      }
    }
  }, [token]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 1. Load token + cached user from secure storage
        const authData = await getAuthData();

        if (authData?.token) {
          setToken(authData.token);

          // Set cached user immediately so UI can show something
          if (authData.user) {
            setUser(authData.user);
          }

          // 2. Fetch fresh profile from backend (gets real relationship_status + partner)
          try {
            await authService.me();
          } catch (e: any) {
            // If the user is not found (404), it means the account was deleted or DB was reset
            if (e.response?.status === 404) {
              console.log('User no longer exists in database, logging out...');
              await authService.logout();
            } else {
              // For other errors (like network timeout), we can use cached data
              console.warn('Could not refresh profile, using cached data:', e.message);
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  if (isLoading) {
    return <SplashScreen navigation={null} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!token ? (
        <AuthNavigator />
      ) : !user?.name ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SignupDetails" component={SignupDetailsScreen} />
        </Stack.Navigator>
      ) : user?.relationship_status === 'couple' ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="CoupleTabs" component={CoupleTabs} />
          <Stack.Screen name="EditRelationshipDate" component={EditRelationshipDateScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="RelationshipSetup" component={RelationshipSetupScreen} />
          <Stack.Screen name="SoloTabs" component={SoloTabs} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
