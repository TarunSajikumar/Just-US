# Refactor Authentication Flow

Transition from OTP-only login to Email + Password login with OTP verification for signup and password resets.

## Proposed Changes

### Backend

#### [User.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/models/User.ts)
- Add `password` field (hashed, hidden by default).
- Add `email_verified` boolean field.

#### [NEW] [PendingUser.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/models/PendingUser.ts)
- Temporary storage for signup data before OTP verification.
- Includes `name`, `email`, `password` (hashed), `otp`, and `otpExpiresAt`.

#### [auth.controller.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/controllers/auth.controller.ts)
- Implement `signup`: Validate email uniqueness, hash password, generate OTP, save to `PendingUser`, send email.
- Implement `verifySignup`: Verify OTP in `PendingUser`, create `User`, return JWT.
- Implement `login`: Verify password with `bcrypt`, return JWT.
- Implement `forgotPassword`: Generate OTP for existing user, send email.
- Implement `verifyResetOtp`: Verify OTP and return a temporary reset token.
- Implement `resetPassword`: Update user password using the reset token.

#### [auth.routes.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/routes/auth.routes.ts)
- Update routes to match new controller methods.

---

### Mobile App

#### [authService.ts](file:///C:/Users/USER/Downloads/JUSTUS/mobile-app/src/services/authService.ts)
- Update methods for `login`, `signup`, `verifySignup`, `forgotPassword`, `resetPassword`.

#### [LoginScreen.tsx](file:///C:/Users/USER/Downloads/JUSTUS/mobile-app/src/screens/auth/LoginScreen.tsx)
- Add password input field.
- Update login logic to use password.
- Add "Forgot Password?" and "Sign Up" navigation.

#### [SignupScreen.tsx](file:///C:/Users/USER/Downloads/JUSTUS/mobile-app/src/screens/auth/SignupScreen.tsx)
- Add Name, Email, Password fields.
- Trigger signup flow.

#### [OtpVerificationScreen.tsx](file:///C:/Users/USER/Downloads/JUSTUS/mobile-app/src/screens/auth/OtpVerificationScreen.tsx)
- Update to handle both signup and reset modes.

#### [NEW] [ForgotPasswordScreen.tsx](file:///C:/Users/USER/Downloads/JUSTUS/mobile-app/src/screens/auth/ForgotPasswordScreen.tsx)
- Screen to request password reset OTP.

#### [NEW] [ResetPasswordScreen.tsx](file:///C:/Users/USER/Downloads/JUSTUS/mobile-app/src/screens/auth/ResetPasswordScreen.tsx)
- Screen to enter new password after OTP verification.

## Verification Plan

### Automated Tests
- I will verify the backend endpoints using manual shell commands (curl) if possible, or by verifying the logic through code analysis.

### Manual Verification
- Verify that signup sends an email with OTP.
- Verify that OTP verification creates a user with the correct details.
- Verify that login works with the correct password and fails with an incorrect one.
- Verify the forgot password flow end-to-end.
