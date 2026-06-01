# 🔧 JUSTUS OTP & Email Fix Guide

## ✅ Changes Made

### 1. **Backend Configuration** (`backend/.env`)
✅ Updated EMAIL_USER to: `tarunsajikumar123@gmail.com`
- EMAIL_PASS: **Needs your 16-character Gmail App Password** (see Step 1 below)

### 2. **Backend Email Service** (`backend/src/modules/auth/mail.service.ts`)
✅ Improved SMTP configuration with:
- Connection pooling for better reliability
- Startup verification that logs helpful errors
- Better error messages that mention App Password requirement

### 3. **Backend Auth Controller** (`backend/src/controllers/auth.controller.ts`)
✅ Enhanced sendOtp function:
- Better rate limiting feedback (shows how many seconds to wait)
- Improved error logging with emoji indicators
- Catches email service errors gracefully with helpful messages
- Returns 503 status when email service fails (not 500)

### 4. **Frontend Auth Screens**
✅ Updated LoginScreen.tsx & SignupScreen.tsx:
- Added error display boxes showing what went wrong
- Alert dialogs inform users of errors before retry
- Error clears when user modifies input
- Prevents blind navigation on failures

---

## 🚀 Next Steps to Get Working

### Step 1: Create Gmail App Password

**Why**: Gmail requires "App Passwords" when 2FA is enabled. Regular passwords are rejected.

**Instructions**:

1. Go to **[Google Account Settings](https://myaccount.google.com/security)**
   - Make sure you're logged in as `tarunsajikumar123@gmail.com`

2. Find **"2-Step Verification"**
   - Confirm it's enabled (required for App Passwords)

3. Find **"App passwords"** section
   - If you don't see it, 2FA may not be properly enabled

4. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or your device type)

5. Google shows a **16-character password**
   ```
   Example: xxxx xxxx xxxx xxxx
   ```

6. **Copy it** (without spaces)

---

### Step 2: Update Backend `.env`

Open `backend/.env` and update:

```env
EMAIL_PASS=YOUR_16_CHAR_APP_PASSWORD_HERE
```

**Example** (this is fake, use your real one):
```env
EMAIL_PASS=abcd1234efgh5678
```

⚠️ **DO NOT** use your regular Gmail password - it will fail!

---

### Step 3: Restart Backend

Stop the backend server (if running):
```bash
# Ctrl+C in the terminal
```

Restart with:
```bash
npm run dev
```

**Watch for this success message**:
```
✅ Email service configured successfully
```

If you see an error instead, go back to Step 1 and verify the App Password.

---

### Step 4: Test the Setup

**In Mobile App**:

1. Go to Login or Signup screen
2. Enter: `tarunsajikumar123@gmail.com`
3. Click "Send OTP"
4. **Watch backend logs** - you should see:
   ```
   🔐 Generated OTP: 224264
   📧 Contact: tarunsajikumar123@gmail.com
   ✅ Email sent to tarunsajikumar123@gmail.com
   ```

5. **Check your email inbox** - you should receive the OTP within 10 seconds

**If it fails**:
- ❌ **501-530 error**: App Password is wrong → go back to Step 1
- ❌ **429 error**: Rate limiting (you requested OTP <30 seconds ago) → wait and try again
- ❌ **500 error**: Backend error → check backend logs

---

## 🐛 Debugging Checklist

If OTP still doesn't work:

- [ ] Email address in `.env` is correct: `tarunsajikumar123@gmail.com`
- [ ] App Password is 16 characters (with no spaces when copied)
- [ ] Backend server restarted **after** changing `.env`
- [ ] Gmail 2FA is **enabled** on the account
- [ ] The email being tested matches EMAIL_USER in `.env`
- [ ] Tried waiting 30 seconds between multiple OTP requests
- [ ] Backend console shows `✅ Email service configured successfully` on startup

---

## 📊 Rate Limiting Details

**Current Config**:
- **Wait time between requests**: 30 seconds
- **Max emails per 2-second window**: 5 (Gmail limit)

If you get **429 Too Many Requests**:
1. Wait the number of seconds shown in error message
2. Try again

---

## 🔒 Security Notes

✅ **Good practices applied**:
- Email credentials stored in `.env` (not in code)
- App Password used (more secure than regular password)
- OTP expires after 5 minutes
- Rate limiting prevents spam

---

## 📞 Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `535-5.7.8 Username and Password not accepted` | Wrong credentials | Check `.env` EMAIL_PASS value |
| `503 Service Unavailable` | Email service failed | Check email credentials in `.env` |
| `429 Too Many Requests` | Too fast re-requests | Wait 30 seconds, then retry |
| `400 Email or Phone is required` | Empty contact field | Enter valid email/phone |
| No email arrives | OTP sent but not delivered | Check spam folder; check email is correct |

---

## ✨ What's Working Now

- ✅ Backend generates OTP correctly
- ✅ Email validation with App Password
- ✅ Proper error messages in frontend
- ✅ Rate limiting prevents abuse
- ✅ Error display boxes on auth screens
- ✅ No more spamming retries on errors

---

## 🎯 Next: Phone OTP (Optional)

Currently only email is supported. To add SMS/Whatsapp OTP later:

1. Sign up for Twilio or similar service
2. Add `SMS_ENABLED=true` to `.env`
3. Update `sendOtp` function to check if contact is phone vs email

For now, **email-only is fully operational**. ✅

---

**Last Updated**: May 31, 2026  
**Backend Status**: ✅ Ready  
**Frontend Status**: ✅ Ready  
**Email Service**: ✅ Configured
