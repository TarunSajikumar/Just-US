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

export default router;
