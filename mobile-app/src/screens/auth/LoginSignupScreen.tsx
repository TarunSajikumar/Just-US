import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { authService } from '../../services/authService';
import { useAuthStore, saveAuthData } from '../../store/authStore';

export default function LoginSignupScreen({ navigation }: any) {
  const [contact, setContact] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { setToken, setUser } = useAuthStore();

  const handleSendOtp = async () => {
    if (!contact.trim()) return;
    setIsSending(true);

    try {
      const response = await authService.sendOtp(contact.trim());

      if (response.userExists) {
        // Direct Login Flow for existing users
        const loginData = await authService.login(contact.trim());
        const { token, user } = loginData;

        // Update the store and local storage
        setToken(token);
        setUser(user);
        await saveAuthData(token, user);

        // Manually trigger a fresh profile sync to ensure partner/couple data is loaded
        try {
          await authService.me();
        } catch (meError) {
          console.error("Post-login profile sync failed", meError);
        }

        setIsSending(false);
        return;
      }

      setIsSending(false);
      navigation.navigate('OTP', { contact: contact.trim() });
    } catch (err: any) {
      console.error('Login/Signup error', err);
      setIsSending(false);
      alert(err?.response?.data?.message || "Failed to continue. Please try again.");
    }
  };

  const isEmail = contact.includes('@');
  const isPhone = /^\+?[0-9]{7,}$/.test(contact);
  const isValid = isEmail || isPhone || contact.length >= 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>❤️</Text>
          <Text style={styles.title}>JusT us</Text>
          <Text style={styles.subtitle}>
            Enter your phone or email to continue
          </Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Phone or Email</Text>
          <TextInput
            placeholder="you@email.com or +91..."
            placeholderTextColor="#555"
            value={contact}
            onChangeText={setContact}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSendOtp}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, (!isValid || isSending) && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={!isValid || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Continue →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  emoji: {
    fontSize: 44,
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    color: COLORS.subtext,
    fontSize: 15,
    lineHeight: 22,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    color: COLORS.subtext,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#2a1520',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
