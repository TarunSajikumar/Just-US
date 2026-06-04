import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginSignupScreen from '@/screens/auth/LoginSignupScreen'
import OtpVerificationScreen from '@/screens/auth/OtpVerificationScreen'
import SignupDetailsScreen from '@/screens/auth/SignupDetailsScreen'
import RelationshipSetupScreen from '@/screens/auth/RelationshipSetupScreen'
import RelationshipPopup from '@/screens/auth/RelationshipPopup'

const Stack = createNativeStackNavigator()

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="LoginSignup" component={LoginSignupScreen} options={{ title: 'Welcome' }} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ title: 'Verify OTP' }} />
      <Stack.Screen name="SignupDetails" component={SignupDetailsScreen} options={{ title: 'Complete Signup' }} />
      <Stack.Screen name="RelationshipSetup" component={RelationshipSetupScreen} options={{ title: 'Relationship Setup' }} />
      <Stack.Screen name="Relationship" component={RelationshipPopup} options={{ title: 'Are You Solo or Couple?' }} />
    </Stack.Navigator>
  )
}
