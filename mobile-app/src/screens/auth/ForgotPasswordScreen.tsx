import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { authService } from '../../services/authService';

const OTP_LENGTH = 6;

type ResetStep = 'email' | 'otp' | 'password';

export default function ForgotPasswordScreen({ navigation }: any) {
  // Shared state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ResetStep>('email');

  // OTP state
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpTimer, setOtpTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // OTP timer effect
  useEffect(() => {
    if (currentStep !== 'otp' || otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer, currentStep]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // Step 1: Send Reset OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email.toLowerCase().trim());

      setCurrentStep('otp');
      setOtpTimer(30);
      setOtp(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send OTP';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Reset OTP
  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      shake();
      setError('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.verifyResetOtp(email.toLowerCase().trim(), fullOtp);

      setOtpVerified(true);
      setCurrentStep('password');
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Invalid OTP';
      setError(errorMessage);
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword({
        email: email.toLowerCase().trim(),
        newPassword,
      });

      Alert.alert(
        'Success',
        'Your password has been reset successfully. Please login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Password reset failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email.toLowerCase().trim());

      setOtpTimer(30);
      setOtp(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to resend OTP';
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
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Secure your account by resetting your password
          </Text>
        </View>

        {/* STEP 1: Email */}
        {currentStep === 'email' && (
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
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
                editable={!isLoading}
              />
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (isLoading || !email.trim()) && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* STEP 2: OTP Verification */}
        {currentStep === 'otp' && (
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Step 2 of 3</Text>
              <Text style={styles.stepDescription}>
                Enter the 6-digit code sent to {email}
              </Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  editable={!isLoading}
                />
              ))}
            </View>

            <View style={styles.timerSection}>
              {otpTimer > 0 ? (
                <Text style={styles.timerText}>Resend in {otpTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                  <Text style={styles.resendLink}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading || otp.join('').length < OTP_LENGTH}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentStep('email')}>
              <Text style={styles.changeText}>← Change Email</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* STEP 3: New Password */}
        {currentStep === 'password' && (
          <Animated.View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Step 3 of 3</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                placeholder="Minimum 8 characters"
                placeholderTextColor="#555"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setError(null);
                }}
                style={styles.input}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                placeholder="Repeat your password"
                placeholderTextColor="#555"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError(null);
                }}
                style={styles.input}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                (!otpVerified ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword ||
                  isLoading) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={
                !otpVerified ||
                newPassword.length < 8 ||
                newPassword !== confirmPassword ||
                isLoading
              }
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentStep('otp')}>
              <Text style={styles.changeText}>← Back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
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
    marginBottom: 10,
  },
  backText: {
    color: COLORS.subtext,
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 30,
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
  },
  stepInfo: {
    marginBottom: 24,
  },
  stepLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stepDescription: {
    color: COLORS.subtext,
    fontSize: 14,
    lineHeight: 20,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  verifiedIcon: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  verifiedText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    color: COLORS.subtext,
    fontSize: 13,
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
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
  changeText: {
    color: COLORS.subtext,
    fontSize: 14,
    textAlign: 'center',
  },
});
