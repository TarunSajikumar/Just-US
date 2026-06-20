import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CoupleHomeScreen from '../screens/couple/CoupleHomeScreen';
import ChatScreen from '../screens/couple/ChatScreen';
import GalleryScreen from '../screens/couple/GalleryScreen';
import TimelineScreen from '../screens/couple/TimelineScreen';
import SettingsScreen from '../screens/couple/SettingsScreen';
import EditRelationshipDateScreen from '../screens/couple/EditRelationshipDateScreen';
import EnhancedTabBar from '../components/EnhancedTabBar'; // Import the new tab bar

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="EditRelationshipDate" component={EditRelationshipDateScreen} />
    </Stack.Navigator>
  );
}

// Chat Stack for proper navigation within Chat
function ChatStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ChatMain" component={ChatScreen} />
      {/* Add other chat-related screens here if needed */}
    </Stack.Navigator>
  );
}

// Gallery Stack for proper navigation
function GalleryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="GalleryMain" component={GalleryScreen} />
      {/* Add gallery detail screens here if needed */}
    </Stack.Navigator>
  );
}

// Timeline Stack
function TimelineStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="TimelineMain" component={TimelineScreen} />
      {/* Add timeline detail screens here if needed */}
    </Stack.Navigator>
  );
}

export default function CoupleTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <EnhancedTabBar {...props} />}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: 'transparent',
        },
      }}
    >
      <Tab.Screen
        name="Gallery"
        component={GalleryStack}
        options={{
          tabBarLabel: 'Gallery',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name="Home"
        component={CoupleHomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Timeline"
        component={TimelineStack}
        options={{
          tabBarLabel: 'Timeline',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
