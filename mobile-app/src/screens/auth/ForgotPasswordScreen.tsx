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

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword(email.toLowerCase().trim());
      setIsLoading(false);
      navigation.navigate('OTP', {
        mode: 'reset',
        email: email.toLowerCase().trim()
      });
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send reset code');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a 6-digit code to reset your password.
        </Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            placeholder="you@email.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, (!email || isLoading) && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={!email || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Send Code</Text>
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
  backBtn: {
    paddingTop: 60,
    paddingHorizontal: 25,
  },
  backText: {
    color: COLORS.subtext,
    fontSize: 16,
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
    marginBottom: 30,
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
