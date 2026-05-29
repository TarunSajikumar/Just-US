import express from "express";
import { signup, login, sendOtp, verifyOtp, getProfile } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, getProfile);

export default router;
