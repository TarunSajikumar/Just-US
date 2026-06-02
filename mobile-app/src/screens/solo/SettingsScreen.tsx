import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { clearAuthData } from '../../store/authStore';
import { useAuthStore } from '../../store/authStore';

export default function SettingsScreen() {
  const logout = useAuthStore((state) => state.logout);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting logout...');
              // Clear auth data from storage
              await clearAuthData();
              console.log('Auth data cleared');
              
              // Clear store state
              setToken(null);
              setUser(null);
              logout();
              console.log('Logout completed, token cleared');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* User Profile Card */}
      <View style={styles.card}>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userDetail}>{user?.email || user?.phone || ''}</Text>
        <Text style={styles.userDetail}>
          Relationship Status: {user?.relationship_status === 'couple' ? 'In a Relationship ❤️' : 'Single'}
        </Text>
      </View>

      {/* Got a Partner? */}
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Got a Partner?</Text>
      </TouchableOpacity>

      {/* Options Card */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Privacy</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 25,
  },
  card: {
    backgroundColor: COLORS.card,
    padding: 22,
    borderRadius: 22,
    marginBottom: 18,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  userDetail: {
    color: COLORS.subtext,
    marginTop: 4,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 18,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#c0392b',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#c0392b',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
