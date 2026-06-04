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
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { saveAuthData } from '../../store/authStore';

const OTP_LENGTH = 6;

export default function OtpVerificationScreen({ navigation, route }: any) {
  const email = route?.params?.email ?? '';
  const mode = route?.params?.mode ?? 'signup'; // 'signup' or 'reset'

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
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
      if (mode === 'signup') {
        const response = await authService.verifySignup({ email, otp: fullOtp });
        if (response.success && response.token && response.user) {
          setToken(response.token);
          await saveAuthData(response.token, response.user);
          await authService.updateStoreWithProfile(response.user);
          // Auto login will happen due to store update
        } else {
          Alert.alert('Error', response.message || 'Verification failed');
          shake();
        }
      } else {
        // Reset Password mode
        const response = await authService.verifyResetOtp(email, fullOtp);
        if (response.success && response.resetToken) {
          navigation.navigate('ResetPassword', { resetToken: response.resetToken });
        } else {
          Alert.alert('Error', response.message || 'Invalid OTP');
          shake();
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Verification failed';
      Alert.alert('Error', msg);
      shake();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      if (mode === 'signup') {
        // We don't have a direct resend signup otp yet, but calling signup again works
        // or we could add a resend-otp route. For now, let's assume the user can go back.
        Alert.alert('Info', 'Please go back and try signing up again to resend OTP');
      } else {
        await authService.forgotPassword(email);
        setTimer(30);
        Alert.alert('OTP Sent', 'A new code has been sent to your email');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  const otpFilled = otp.every((d) => d !== '');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the code sent to{'\n'}
          <Text style={styles.contactHighlight}>{email}</Text>
        </Text>

        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : null]}
              value={otp[i]}
              onChangeText={(val) => handleChange(val, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
            />
          ))}
        </Animated.View>

        <TouchableOpacity
          style={[styles.verifyBtn, !otpFilled && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={!otpFilled || isVerifying}
        >
          <Text style={styles.verifyBtnText}>
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={handleResend}
          disabled={timer > 0}
        >
          <Text style={timer > 0 ? styles.resendCountdown : styles.resendActive}>
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
          </Text>
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
    width: 45,
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
    opacity: 0.5,
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendBtn: {
    alignItems: 'center',
  },
  resendCountdown: {
    color: COLORS.subtext,
  },
  resendActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
