import express from "express";
import {
  signup,
  verifyEmailOtp,
  register,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
  updateProfile,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

// Test email endpoint - sends a test OTP email
router.get("/test-email", async (req, res) => {
  try {
    const { sendOtpEmail } = await import("../modules/auth/mail.service");
    const testEmail = "test@example.com";
    
    await sendOtpEmail(testEmail, "123456");
    res.status(200).json({ 
      message: "Test email sent successfully",
      sentTo: testEmail,
      status: "✅ BREVO SMTP WORKING"
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: "Failed to send test email",
      error: error.message,
      status: "❌ BREVO SMTP ERROR"
    });
  }
});

export default router;
