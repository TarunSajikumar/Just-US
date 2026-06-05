import React, { useState, useEffect, useRef } from 'react';
import '../styles/auth.css';

const OTP_LENGTH = 6;

type ResetStep = 'email' | 'otp' | 'password';

interface ForgotPasswordPageProps {
  onResetSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export default function ForgotPasswordPage({
  onResetSuccess,
  onNavigateToLogin,
}: ForgotPasswordPageProps) {
  // Shared state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ResetStep>('email');

  // OTP state
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpTimer, setOtpTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // API helper
  const apiCall = async (
    endpoint: string,
    method: string,
    data?: any
  ) => {
    const response = await fetch(`/api/auth${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }

    return await response.json();
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
      await apiCall('/forgot-password', 'POST', {
        email: email.toLowerCase().trim(),
      });

      setCurrentStep('otp');
      setOtpTimer(30);
      setOtp(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Reset OTP
  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      setError('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiCall('/verify-reset-otp', 'POST', {
        email: email.toLowerCase().trim(),
        otp: fullOtp,
      });

      setOtpVerified(true);
      setCurrentStep('password');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
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
      await apiCall('/reset-password', 'POST', {
        email: email.toLowerCase().trim(),
        newPassword,
      });

      alert('Your password has been reset successfully. Please login with your new password.');

      if (onNavigateToLogin) {
        onNavigateToLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
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

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiCall('/forgot-password', 'POST', {
        email: email.toLowerCase().trim(),
      });

      setOtpTimer(30);
      setOtp(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button
          className="btn-back"
          onClick={() => {
            if (onNavigateToLogin) {
              onNavigateToLogin();
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#a8b5c5',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '0 0 20px 0',
            marginBottom: '20px',
          }}
        >
          ← Back
        </button>

        <div className="auth-header" style={{ marginBottom: '30px' }}>
          <div className="auth-emoji">🔑</div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Secure your account by resetting your password
          </p>
        </div>

        {/* STEP 1: Email */}
        {currentStep === 'email' && (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
              className="btn btn-primary"
              onClick={handleSendOtp}
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {currentStep === 'otp' && (
          <div className="auth-form">
            <div className="step-info">
              <p className="step-label">Step 2 of 3</p>
              <p className="step-description">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            <div className="otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="otp-input"
                  disabled={isLoading}
                />
              ))}
            </div>

            <div className="timer-section">
              {otpTimer > 0 ? (
                <p className="timer-text">Resend in {otpTimer}s</p>
              ) : (
                <button
                  className="btn-link"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  Resend Code
                </button>
              )}
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
              className="btn btn-primary"
              onClick={handleVerifyOtp}
              disabled={
                isLoading ||
                otp.join('').length < OTP_LENGTH
              }
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              className="btn btn-link"
              onClick={() => setCurrentStep('email')}
            >
              ← Change Email
            </button>
          </div>
        )}

        {/* STEP 3: New Password */}
        {currentStep === 'password' && (
          <div className="auth-form">
            <div className="step-info">
              <p className="step-label">Step 3 of 3</p>
              <div className="verified-badge">
                <span className="verified-icon">✓</span>
                <span className="verified-text">Verified</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
              className="btn btn-primary"
              onClick={handleResetPassword}
              disabled={
                !otpVerified ||
                newPassword.length < 8 ||
                newPassword !== confirmPassword ||
                isLoading
              }
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              className="btn btn-link"
              onClick={() => setCurrentStep('otp')}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
