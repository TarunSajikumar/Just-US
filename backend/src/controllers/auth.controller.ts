import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOtp } from "../services/otp.service";
import { sendOtpEmail } from "../modules/auth/mail.service";
import User from "../models/User";
import PendingUser from "../models/PendingUser";
import Otp from "../models/Otp";
import Couple from "../models/Couple";

const resolveFullProfile = async (user: any) => {
  let partner = null;
  let relationshipStartDate = null;
  let anniversaryDate = null;
  let nextMeetDate = null;

  try {
    if (user.couple_id && user.couple_id !== "" && user.couple_id !== "null") {
      const [partnerData, coupleData] = await Promise.all([
        user.partner_id ? User.findById(user.partner_id) : Promise.resolve(null),
        Couple.findById(user.couple_id)
      ]);
      partner = partnerData;
      relationshipStartDate = coupleData?.relationshipStartDate || coupleData?.createdAt;
      anniversaryDate = coupleData?.anniversaryDate || null;
      nextMeetDate = coupleData?.nextMeetDate || null;
    }
  } catch (error) {
    console.error("resolveFullProfile error:", error);
  }

  return {
    ...user.toObject(),
    partner,
    relationshipStartDate,
    anniversaryDate,
    nextMeetDate,
  };
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    await PendingUser.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name,
        password: hashedPassword,
        otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { upsert: true }
    );

    await sendOtpEmail(normalizedEmail, otp);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

export const verifySignup = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const pendingUser = await PendingUser.findOne({ email: normalizedEmail });
    if (!pendingUser) {
      return res.status(400).json({ message: "Registration session not found or expired" });
    }

    if (pendingUser.otp !== otp || pendingUser.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      email_verified: true,
      relationship_status: "none",
    });

    await PendingUser.deleteOne({ _id: pendingUser._id });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    const fullProfile = await resolveFullProfile(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: fullProfile,
    });
  } catch (error: any) {
    console.error("Verify Signup error:", error);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    const fullProfile = await resolveFullProfile(user);

    res.status(200).json({
      success: true,
      message: "Login success",
      token,
      user: fullProfile
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    await Otp.findOneAndUpdate(
      { contact: normalizedEmail },
      {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { upsert: true }
    );

    await sendOtpEmail(normalizedEmail, otp);

    res.status(200).json({ message: "Reset OTP sent to email" });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send reset OTP", error: error.message });
  }
};

export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({ contact: normalizedEmail });
    if (!otpRecord || otpRecord.code !== otp || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Generate a temporary reset token
    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: "password_reset" },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ success: true, resetToken });
  } catch (error: any) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string) as any;
    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email: decoded.email },
      { password: hashedPassword }
    );

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(400).json({ message: "Invalid or expired reset token" });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const fullProfile = await resolveFullProfile(user);
    res.json(fullProfile);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, birthday, gender } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, birthday, gender, relationship_status: user.relationship_status === "none" ? "solo" : user.relationship_status },
      { new: true }
    );
    const fullProfile = await resolveFullProfile(updatedUser);
    res.status(200).json({ success: true, user: fullProfile });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};
