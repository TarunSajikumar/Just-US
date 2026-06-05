import React, { useState, useEffect, useRef } from 'react';
import '../styles/auth.css';

const OTP_LENGTH = 6;

type SignupStep = 'email' | 'otp' | 'password';

interface SignupPageProps {
  onSignupSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export default function SignupPage({
  onSignupSuccess,
  onNavigateToLogin,
}: SignupPageProps) {
  // Shared state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<SignupStep>('email');

  // OTP state
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpTimer, setOtpTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

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

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiCall('/signup', 'POST', {
        name: name.trim(),
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

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      setError('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiCall('/verify-email-otp', 'POST', {
        email: email.toLowerCase().trim(),
        otp: fullOtp,
      });

      setEmailVerified(true);
      setCurrentStep('password');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Register with password
  const handleRegister = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/register', 'POST', {
        email: email.toLowerCase().trim(),
        password,
      });

      if (response.success && response.token) {
        // Store token and user data
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        if (onSignupSuccess) {
          onSignupSuccess();
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
      await apiCall('/signup', 'POST', {
        name: name.trim(),
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
        <div className="auth-header">
          <div className="auth-emoji">✨</div>
          <h1 className="auth-title">Join JustUs</h1>
          <p className="auth-subtitle">Create an account to start your journey</p>
        </div>

        {/* STEP 1: Email & Name */}
        {currentStep === 'email' && (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="form-input"
                disabled={isLoading}
              />
            </div>

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
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>

            <div className="auth-footer">
              Already have an account?{' '}
              <a href="#" onClick={(e) => {
                e.preventDefault();
                if (onNavigateToLogin) onNavigateToLogin();
              }}>
                Login
              </a>
            </div>
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
                  Resend OTP
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
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              className="btn btn-link"
              onClick={() => setCurrentStep('email')}
            >
              ← Change Email
            </button>
          </div>
        )}

        {/* STEP 3: Password */}
        {currentStep === 'password' && (
          <div className="auth-form">
            <div className="step-info">
              <p className="step-label">Step 3 of 3</p>
              <div className="verified-badge">
                <span className="verified-icon">✓</span>
                <span className="verified-text">Email Verified</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
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
              onClick={handleRegister}
              disabled={
                !emailVerified ||
                password.length < 8 ||
                password !== confirmPassword ||
                isLoading
              }
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
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
