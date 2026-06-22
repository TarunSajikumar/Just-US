import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOtp } from "../services/otp.service";
import { sendOtpEmail } from "../modules/auth/mail.service";
import User from "../models/User";
import PendingUser from "../models/PendingUser";
import Otp from "../models/Otp";
import Couple from "../models/Couple";

const getNextAnniversary = (relationshipStartDate: Date | string): Date => {
  const start = new Date(relationshipStartDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const nextAnn = new Date(currentYear, start.getMonth(), start.getDate());
  nextAnn.setHours(0, 0, 0, 0);

  if (nextAnn.getTime() < today.getTime()) {
    nextAnn.setFullYear(currentYear + 1);
  }
  return nextAnn;
};

const resolveFullProfile = async (user: any) => {
  let partner = null;
  let relationshipStartDate = null;
  let anniversaryDate = null;

  try {
    if (user.couple_id && user.couple_id !== "" && user.couple_id !== "null") {
      const [partnerData, coupleData] = await Promise.all([
        user.partner_id ? User.findById(user.partner_id) : Promise.resolve(null),
        Couple.findById(user.couple_id)
      ]);
      partner = partnerData;
      relationshipStartDate = coupleData?.relationshipStartDate || coupleData?.createdAt || new Date();
      anniversaryDate = getNextAnniversary(relationshipStartDate);
    }
  } catch (error) {
    console.error("resolveFullProfile error:", error);
  }

  return {
    ...user.toObject(),
    partner,
    relationshipStartDate,
    anniversaryDate,
  };
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    console.log(`📝 Signup initiated for: ${email}`);

    // Validation
    if (!name || !email) {
      console.log("❌ Missing name or email");
      return res.status(400).json({ message: "Name and email are required" });
    }

    if (typeof name !== 'string' || typeof email !== 'string') {
      console.log("❌ Invalid name or email type");
      return res.status(400).json({ message: "Name and email must be strings" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.log(`❌ Invalid email format: ${normalizedEmail}`);
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log(`⚠️ Signup failed: Email ${normalizedEmail} already exists`);
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate OTP
    const otp = generateOtp();
    console.log(`🔐 Generated OTP for ${normalizedEmail}: ${otp}`);

    // Create or update PendingUser
    let pending;
    try {
      pending = await PendingUser.findOneAndUpdate(
        { email: normalizedEmail },
        {
          email: normalizedEmail,
          name: name.trim(),
          password: null,
          otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          email_verified: false,
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
      console.log(`✅ PendingUser created/updated: ${pending?._id}`);
    } catch (err) {
      console.error("❌ PENDING USER ERROR:", err);
      return res.status(500).json({ message: "Failed to process registration. Please try again." });
    }

    // Send OTP email
    try {
      await sendOtpEmail(normalizedEmail, otp);
      console.log(`✅ OTP email sent to ${normalizedEmail}`);
      return res.status(200).json({ message: "OTP sent to email. Please check your inbox." });
    } catch (mailError: any) {
      console.error(`❌ Email sending failed:`, mailError.message);
      // Still return success but inform user to check if email was received
      return res.status(200).json({ 
        message: "Signup initiated. If you don't receive an email in 2 minutes, please try again.",
        debug: process.env.NODE_ENV === 'development' ? mailError.message : undefined
      });
    }
  } catch (error: any) {
    console.error("❌ SIGNUP ERROR:", error);
    return res.status(500).json({
      message: "An unexpected error occurred. Please try again later.",
      ...(process.env.NODE_ENV === 'development' && { error: error?.message })
    });
  }
};

export const verifyEmailOtp = async (req: Request, res: Response) => {
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

    // Mark email as verified in pending user
    await PendingUser.findByIdAndUpdate(
      pendingUser._id,
      { email_verified: true },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error: any) {
    console.error("Verify Email OTP error:", error);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Verify email was already verified via OTP
    const pendingUser = await PendingUser.findOne({ email: normalizedEmail });
    if (!pendingUser || !pendingUser.email_verified) {
      return res.status(400).json({ message: "Email not verified. Please verify your email first." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: hashedPassword,
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
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
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
    if (!otpRecord || otpRecord.code !== otp || !otpRecord.expiresAt || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error: any) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Verify user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashedPassword },
      { returnDocument: 'after' }
    );

    // Clean up OTP record
    await Otp.deleteOne({ contact: normalizedEmail });

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(400).json({ message: "Password reset failed" });
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
      { returnDocument: 'after' }
    );
    const fullProfile = await resolveFullProfile(updatedUser);
    // Emit socket event to partner so UI updates instantly
    try {
      const { getIO, getCoupleRoomId } = await import('../sockets');
      const io = getIO();
      if (io && updatedUser && updatedUser.partner_id) {
        const payload = {
          userId: updatedUser._id.toString(),
          name: updatedUser.name,
          birthday: updatedUser.birthday || null,
          gender: updatedUser.gender || null,
        };
          const partnerRoom = updatedUser.partner_id.toString();
          io.to(partnerRoom).emit('profile_updated', payload);
      }
    } catch (emitErr) {
      console.error('Failed to emit profile_updated socket event:', emitErr);
    }

    res.status(200).json({ success: true, user: fullProfile });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};
