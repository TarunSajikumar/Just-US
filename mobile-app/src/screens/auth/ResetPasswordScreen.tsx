import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { authService } from '../../services/authService';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const resetToken = route?.params?.resetToken;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        resetToken,
        newPassword: newPassword.trim(),
      });
      setIsLoading(false);
      Alert.alert('Success', 'Password updated successfully', [
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>🛡️</Text>
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>
          Create a new secure password for your account.
        </Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            placeholder="Minimum 6 characters"
            placeholderTextColor="#555"
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <TextInput
            placeholder="Repeat your password"
            placeholderTextColor="#555"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, (!newPassword || !confirmPassword || isLoading) && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={!newPassword || !confirmPassword || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    color: COLORS.subtext,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 40,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.subtext,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
