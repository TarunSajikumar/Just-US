# Updated Signup & Password Reset Flow Implementation

## Overview

The new signup and password reset flows implement a **clean, email-verification-first approach** that ensures email validity before account creation. This document outlines the complete implementation across all platforms.

---

## 📊 Flow Diagrams

### Signup Flow
```
STEP 1: Email Verification
├── Enter Name & Email
├── Send OTP
└── OTP sent to email

        ↓

STEP 2: Email Verification
├── Enter 6-digit OTP
├── Verify OTP
└── Email marked as verified ✓

        ↓

STEP 3: Account Creation
├── Enter Password (min 8 chars)
├── Confirm Password
└── Create Account
    └── Generate JWT
    └── Auto-login
    └── Navigate to Couple Connection

```

### Password Reset Flow
```
STEP 1: Email Verification
├── Enter Email
├── Send Reset OTP
└── OTP sent to email

        ↓

STEP 2: Email Verification
├── Enter 6-digit OTP
├── Verify OTP
└── Email marked as verified ✓

        ↓

STEP 3: Password Update
├── Enter New Password (min 8 chars)
├── Confirm Password
└── Reset Password
    └── Password updated
    └── Return to Login
```

---

## 🔧 Backend Implementation

### Updated Endpoints

#### 1. **POST /auth/signup** (NEW BEHAVIOR)
**Step 1: Initiate Registration**
- Only accepts `name` and `email`
- No password required at this stage
- Generates OTP and sends email
- Creates/updates PendingUser record with `email_verified: false`

**Request:**
```json
{
  "name": "Tarun",
  "email": "tarun@gmail.com"
}
```

**Response (200):**
```json
{
  "message": "OTP sent to email"
}
```

#### 2. **POST /auth/verify-email-otp** (NEW ENDPOINT)
**Step 2: Verify Email OTP**
- Validates OTP matches and hasn't expired
- Marks `email_verified: true` in PendingUser
- Does NOT create account yet

**Request:**
```json
{
  "email": "tarun@gmail.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 3. **POST /auth/register** (NEW ENDPOINT)
**Step 3: Create Account**
- Requires email to be already verified via OTP
- Accepts email and password
- Creates User account in database
- Returns JWT token + full user profile
- Requires password ≥ 8 characters

**Request:**
```json
{
  "email": "tarun@gmail.com",
  "password": "Password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "Tarun",
    "email": "tarun@gmail.com",
    "email_verified": true,
    ...
  }
}
```

#### 4. **POST /auth/forgot-password** (UPDATED)
**Step 1: Initiate Password Reset**
- Only accepts email
- Generates OTP and sends reset email
- Creates/updates Otp record

**Request:**
```json
{
  "email": "tarun@gmail.com"
}
```

**Response (200):**
```json
{
  "message": "Reset OTP sent to email"
}
```

#### 5. **POST /auth/verify-reset-otp** (UPDATED)
**Step 2: Verify Reset OTP**
- Validates OTP for password reset
- Returns success without creating token

**Request:**
```json
{
  "email": "tarun@gmail.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

#### 6. **POST /auth/reset-password** (UPDATED)
**Step 3: Update Password**
- Accepts email and new password
- Updates password in User record
- Requires password ≥ 8 characters
- Deletes OTP record after use

**Request:**
```json
{
  "email": "tarun@gmail.com",
  "newPassword": "NewPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

### Model Updates

#### PendingUser Model
```typescript
{
  email: String (unique),
  name: String,
  password: String | null,      // Only set after OTP verification
  otp: String,
  otpExpiresAt: Date,
  email_verified: Boolean,      // NEW: Tracks OTP verification status
  createdAt: Date,
  updatedAt: Date
}
```

**Key Changes:**
- `password` is now optional (null until Step 3)
- New `email_verified` boolean field
- TTL auto-delete after 1 hour

---

## 📱 Mobile App Implementation

### Updated Auth Service

```typescript
// SIGNUP FLOW
signup({ name, email })                    // Step 1: Send OTP
verifyEmailOtp({ email, otp })            // Step 2: Verify OTP
register({ email, password })              // Step 3: Create account

// PASSWORD RESET FLOW
forgotPassword(email)                      // Step 1: Send reset OTP
verifyResetOtp(email, otp)                 // Step 2: Verify OTP
resetPassword({ email, newPassword })      // Step 3: Reset password
```

### SignupScreen Component

**Features:**
- ✅ Three-step form in single component
- ✅ Step 1: Name & Email with "Send OTP" button
- ✅ Step 2: 6-digit OTP input with 30s countdown and resend
- ✅ Step 3: Password fields enabled only after email verification
- ✅ Email verified badge displayed in Step 3
- ✅ Continue button disabled until all validations pass
- ✅ Error handling and loading states

**Key Logic:**
```typescript
// Step 3 Continue button is enabled only when:
canContinue = 
  emailVerified &&
  name.length > 0 &&
  password.length >= 8 &&
  password === confirmPassword
```

### ForgotPasswordScreen Component

**Features:**
- ✅ Three-step form matching signup pattern
- ✅ Step 1: Email with "Send Reset Code" button
- ✅ Step 2: 6-digit OTP input with resend
- ✅ Step 3: New password & confirm password fields
- ✅ Success alert and navigation to login on completion

---

## 🌐 Web Implementation

### React Components

#### SignupPage Component
- Location: `web/src/pages/auth/SignupPage.tsx`
- Same three-step flow as mobile
- API calls to `/api/auth/*` endpoints
- localStorage token storage
- Callback hooks for navigation

#### ForgotPasswordPage Component
- Location: `web/src/pages/auth/ForgotPasswordPage.tsx`
- Same three-step flow as mobile
- Password reset workflow
- Returns to login on success

#### Styling
- Location: `web/src/styles/auth.css`
- Consistent design system
- Responsive mobile-first approach
- Dark theme matching mobile app

### API Integration

```typescript
// All web components use this pattern:
const apiCall = async (endpoint: string, method: string, data?: any) => {
  const response = await fetch(`/api/auth${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) throw new Error((await response.json()).message);
  return await response.json();
};
```

---

## ✅ Validation Rules

### Signup Step 1
- Name: Required, non-empty
- Email: Required, valid email format

### Signup Step 2
- OTP: Exactly 6 digits, must be correct
- OTP Timeout: 10 minutes expiry

### Signup Step 3
- Password: Minimum 8 characters
- Confirm Password: Must match password
- Email Verification: Must be verified

### Forgot Password
- Same validation rules as signup steps 2-3
- Email must exist in User collection (for Step 1)

---

## 🔐 Security Considerations

1. **Email Verification First**
   - No password stored until email is verified
   - Prevents spam account creation
   - OTP must be correct before proceeding

2. **Password Requirements**
   - Minimum 8 characters (enforced on both frontend & backend)
   - Hashed with bcrypt (10 rounds)
   - Never transmitted in plain text

3. **OTP Security**
   - 6-digit numeric OTP (1 million possibilities)
   - 10-minute expiration
   - Single use (deleted after verification)
   - Email-only delivery (no SMS to reduce costs)

4. **JWT Tokens**
   - 30-day expiration
   - Stored securely (localStorage on web, AsyncStorage on mobile)

5. **PendingUser TTL**
   - Auto-deleted after 1 hour if not completed
   - Prevents database bloat from incomplete registrations

---

## 🧪 Testing Checklist

### Signup Flow
- [ ] Step 1: Send OTP with valid email
- [ ] Step 1: Error on missing fields
- [ ] Step 1: Error on invalid email format
- [ ] Step 2: Verify correct OTP
- [ ] Step 2: Error on incorrect OTP
- [ ] Step 2: Resend OTP after timer expires
- [ ] Step 3: Show "Email Verified" badge
- [ ] Step 3: Validate password minimum length
- [ ] Step 3: Validate password match
- [ ] Step 3: Continue button disabled until all validations pass
- [ ] Account creation with auto-login

### Forgot Password Flow
- [ ] Step 1: Send reset OTP
- [ ] Step 1: Error on user not found
- [ ] Step 2: Verify correct OTP
- [ ] Step 2: Resend OTP functionality
- [ ] Step 3: Update password
- [ ] Step 3: Validate new password requirements
- [ ] Redirect to login on success

### Edge Cases
- [ ] Back navigation between steps
- [ ] Network error handling
- [ ] OTP expiration handling
- [ ] Concurrent signup attempts (same email)
- [ ] Session persistence after refresh

---

## 📝 Environment Variables

No new environment variables required. Existing configuration sufficient:
- `JWT_SECRET`: For token generation
- `EMAIL_USER` & `EMAIL_PASS`: For OTP email delivery
- `DB_URL`: For MongoDB connection

---

## 🚀 Deployment Notes

1. **Database Migration**: PendingUser model changes are backward compatible
2. **Routes**: New routes added alongside existing endpoints
3. **Backward Compatibility**: Old `/verify-signup` endpoint can be deprecated after migration
4. **Frontend Updates**: Both mobile and web apps must be updated together

---

## 📞 Support

For issues or questions regarding the new flow:
1. Check error messages in server logs
2. Verify OTP expiration in database
3. Ensure email service is configured correctly
4. Test with network throttling on mobile

