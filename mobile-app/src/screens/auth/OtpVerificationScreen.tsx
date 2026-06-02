import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { api } from '../../services/api';
import { saveAuthData } from '../../store/authStore';
import { useAuthStore } from '../../store/authStore';

const OTP_LENGTH = 6;

export default function OtpVerificationScreen({ navigation, route }: any) {
  // contact: phone or email the OTP was sent to
  const contact = route?.params?.contact ?? '';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    // Accept only digits
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const resp = await api.post('/auth/send-otp', { email: contact });
      Alert.alert('OTP Sent', resp.data?.message || 'A new code was sent');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimer(30);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('Resend OTP error', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to resend OTP';
      Alert.alert('Resend failed', msg);
    } finally {
      setIsResending(false);
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      shake();
      return;
    }

    setIsVerifying(true);

    try {
      const response = await api.post('/auth/verify-otp', { email: contact, otp: fullOtp });
      const { verified, token, user, isNewUser } = response.data;

      setIsVerifying(false);

      if (!verified) {
        shake();
        Alert.alert('Error', response.data?.message || 'Invalid or expired OTP');
        return;
      }

      if (verified && token && user) {
        await saveAuthData(token, user);
        setToken(token);
        setUser(user);

        // If new user, show signup details form
        // If existing user, they will be auto-logged in to home screen
        if (isNewUser) {
          navigation.replace('SignupDetails', { contact });
        }
        return;
      }
    } catch (err: any) {
      console.error('OTP verify error', err);
      setIsVerifying(false);
      shake();
      const msg = err?.response?.data?.message || 'Verification failed';
      Alert.alert('Error', msg);
    }
  };

  const otpFilled = otp.every((d) => d !== '');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.contactHighlight}>{contact || 'your phone / email'}</Text>
        </Text>

        {/* 6-Box OTP Input */}
        <Animated.View
          style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[
                styles.otpBox,
                otp[i] ? styles.otpBoxFilled : null,
              ]}
              value={otp[i]}
              onChangeText={(val) => handleChange(val, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              returnKeyType="done"
              selectTextOnFocus
              caretHidden
            />
          ))}
        </Animated.View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyBtn, !otpFilled && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={!otpFilled || isVerifying}
          activeOpacity={0.8}
        >
          <Text style={styles.verifyBtnText}>
            {isVerifying ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendBtn}
          onPress={handleResend}
          disabled={timer > 0}
          activeOpacity={0.7}
        >
          {timer > 0 ? (
            <Text style={styles.resendCountdown}>
              Resend OTP in{' '}
              <Text style={styles.resendTimer}>{timer}s</Text>
            </Text>
          ) : (
            <Text style={styles.resendActive}>Resend OTP</Text>
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
    paddingBottom: 10,
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
  contactHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  otpBox: {
    width: 48,
    height: 60,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#1a0a12',
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyBtnDisabled: {
    backgroundColor: '#2a1520',
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendCountdown: {
    color: COLORS.subtext,
    fontSize: 14,
  },
  resendTimer: {
    color: '#fff',
    fontWeight: '600',
  },
  resendActive: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
