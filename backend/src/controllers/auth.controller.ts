import { Request, Response } from "express";
import { signupUser, loginUser } from "../services/auth.service";
import { generateOtp } from "../services/otp.service";
import { sendOtpEmail } from "../modules/auth/mail.service";
import env from "../config/env";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp";
import User from "../models/User";
import Couple from "../models/Couple";

export const sendOtp = async (req: Request, res: Response) => {
  const email = req.body.email || req.body.phone;
  if (!email) {
    return res.status(400).json({ message: "Email or Phone is required" });
  }

  try {
    // Rate limiting: Check if an OTP was sent recently (e.g., in the last 30 seconds)
    const existingOtp = await Otp.findOne({ contact: email });

    if (existingOtp) {
      const lastSent = new Date(existingOtp.updatedAt as Date).getTime();
      const timeSinceLastRequest = Date.now() - lastSent;
      
      if (timeSinceLastRequest < 30000) {
        const secondsToWait = Math.ceil((30000 - timeSinceLastRequest) / 1000);
        return res.status(429).json({ 
          message: `Please wait ${secondsToWait} seconds before requesting another OTP`,
          retryAfter: secondsToWait 
        });
      }
    }

    const otp = generateOtp();

    console.log("🔐 Generated OTP:", otp);
    console.log("📧 Contact:", email);

    const otpRecord = await Otp.findOneAndUpdate(
      { contact: email },
      {
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    // Send Email 
    if (email.includes('@')) {
      try {
        await sendOtpEmail(email, otp);
        console.log("✅ OTP email sent successfully to:", email);
      } catch (emailError: any) {
        console.error("❌ Email sending failed:", emailError.message);
        
        // Still save OTP for fallback, but inform user
        return res.status(503).json({ 
          message: "Email service temporarily unavailable. Please try again.",
          error: emailError.message 
        });
      }
    }

    res.status(200).json({ 
      message: "OTP sent successfully",
      contact: email,
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error: any) {
    console.error("❌ Send OTP Error:", error);
    res.status(500).json({ 
      message: "Failed to send OTP", 
      error: error.message 
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const contact = email || req.body.phone;

  if (!contact || !otp) {
    return res.status(400).json({ message: "Contact and OTP are required" });
  }

  try {
    // 1. Verify OTP
    const existingOtp = await Otp.findOne({ contact });

    console.log("Contact:", contact);
    console.log("Received OTP:", otp);
    console.log("Stored OTP:", existingOtp?.code);

    if (!existingOtp) {
      return res.status(400).json({ verified: false, message: "OTP not found" });
    }

    if (String(existingOtp.code) !== String(otp)) {
      return res.status(400).json({ verified: false, message: "Invalid or incorrect OTP" });
    }

    if (new Date(existingOtp.expiresAt as Date) < new Date()) {
      return res.status(400).json({ verified: false, message: "OTP has expired" });
    }

    // 2. Find or Create User
    let user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await User.create({
        email: contact.includes("@") ? contact : null,
        phone: !contact.includes("@") ? contact : null,
        relationship_status: "none",
      });
    }

    // 3. Cleanup OTP
    await Otp.deleteOne({ _id: existingOtp._id });

    // 4. Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: "30d" });

    res.status(200).json({
      success: true,
      verified: true,
      isNewUser,
      token,
      user,
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { user, token } = await signupUser(req.body);

    res.status(201).json({
      message: "Signup success",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Signup failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = await loginUser(req.body);

    res.status(200).json({
      message: "Login success",
      ...data,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const getProfile = async (req: any, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Resolve partner and couple if couple exists
    let partner = null;
    let relationshipStartDate = null;
    let anniversaryDate = null;
    let nextMeetDate = null;

    if (user.couple_id) {
      const [partnerData, coupleData] = await Promise.all([
        User.findById(user.partner_id),
        Couple.findById(user.couple_id)
      ]);
      partner = partnerData;
      relationshipStartDate = coupleData?.relationshipStartDate || coupleData?.createdAt;
      anniversaryDate = coupleData?.anniversaryDate || null;
      nextMeetDate = coupleData?.nextMeetDate || null;
    }

    res.json({
      ...user.toObject(),
      partner,
      relationshipStartDate,
      anniversaryDate,
      nextMeetDate,
      partnerPingMessage: user.partnerPingMessage
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  const userId = req.userId;
  const { name, birthday, gender } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        birthday,
        gender,
        relationship_status: "solo",
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update profile" });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};
