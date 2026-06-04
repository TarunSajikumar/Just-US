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
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { authService } from '../../services/authService';

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.signup({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password.trim(),
      });

      setIsLoading(false);
      // Navigate to OTP for verification
      navigation.navigate('OTP', {
        mode: 'signup',
        email: email.toLowerCase().trim()
      });
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err?.response?.data?.message || err?.message || 'Signup failed';
      setError(errorMessage);
    }
  };

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
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Join JustUs</Text>
          <Text style={styles.subtitle}>Create an account to start your journey</Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            placeholder="John Doe"
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
            style={styles.input}
            autoCorrect={false}
          />
        </View>

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

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            placeholder="Minimum 6 characters"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            placeholder="Repeat your password"
            placeholderTextColor="#555"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryBtnText}>
            Already have an account? <Text style={styles.link}>Login</Text>
          </Text>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  emoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.subtext,
    fontSize: 15,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
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
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  secondaryBtn: {
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.subtext,
    fontSize: 15,
  },
  link: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
