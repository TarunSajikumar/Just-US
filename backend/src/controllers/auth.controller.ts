import { Request, Response } from "express";
import { signupUser, loginUser } from "../services/auth.service";
import { generateOtp } from "../services/otp.service";
import { transporter } from "../modules/auth/mail.service";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp";
import User from "../models/User";

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
      if (Date.now() - lastSent < 30000) {
        return res.status(429).json({ message: "Please wait 30 seconds before requesting another OTP" });
      }
    }

    const otp = generateOtp();

    console.log("Generated OTP:", otp);
    console.log("Contact:", email);

    await Otp.findOneAndUpdate(
      { contact: email },
      {
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    // Send Email (or SMS in future)
    if (email.includes('@')) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "JusT us Verification Code 💌",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
            <h2 style="color: #ff4d8d; text-align: center;">💌 Welcome to JusT us</h2>
            <p style="font-size: 16px; text-align: center;">Your secure verification code:</p>
            <div style="background: #fff0f5; padding: 20px; border-radius: 15px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0; color: #ff4d8d; border: 2px dashed #ff4d8d;">
              ${otp}
            </div>
            <p style="font-size: 14px; text-align: center; color: #777;">This OTP will expire in 5 minutes.</p>
            <p style="font-size: 14px; text-align: center; color: #777;">⚠️ Never share your OTP with anyone.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="text-align: center; font-size: 14px; color: #999;">With love,<br/>Team JusT us ❤️</p>
          </div>
        `,
      });
    }

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
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

    // Resolve partner if couple exists
    const partner = user.partner_id
      ? await User.findById(user.partner_id)
      : null;

    res.json({ ...user.toObject(), partner });
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
