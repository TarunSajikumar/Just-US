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
import { useAuthStore } from '../../store/authStore';
import { saveAuthData } from '../../store/authStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setToken = useAuthStore((state) => state.setToken);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({
        email: email.toLowerCase().trim(),
        password: password.trim(),
      });

      if (response.success && response.token && response.user) {
        setToken(response.token);
        await saveAuthData(response.token, response.user);
        await authService.updateStoreWithProfile(response.user);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
          <Text style={styles.emoji}>❤️</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your JustUs account</Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            placeholder="you@email.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#555"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotBtn}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, (!email || !password || isLoading) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.secondaryBtnText}>
            New to JustUs? <Text style={styles.link}>Create account</Text>
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
    paddingHorizontal: 25,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
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
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.subtext,
    marginHorizontal: 12,
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
