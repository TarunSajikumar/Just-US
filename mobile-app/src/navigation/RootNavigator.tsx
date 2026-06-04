import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
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
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OTP" component={OtpVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
      if (navigationRef.current) {
        setTimeout(() => {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 100);
      }
    }
  }, [token]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const authData = await getAuthData();
        if (authData?.token) {
          setToken(authData.token);
          if (authData.user) {
            setUser(authData.user);
          }
          try {
            await authService.me();
          } catch (e: any) {
            if (e.response?.status === 404) {
              await authService.logout();
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
