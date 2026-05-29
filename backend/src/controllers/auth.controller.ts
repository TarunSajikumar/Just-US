import { Request, Response } from "express";
import { signupUser, loginUser } from "../services/auth.service";
import { generateOtp } from "../services/otp.service";
import { supabase } from "../config/supabase";
import { transporter } from "../modules/auth/mail.service";
import jwt from "jsonwebtoken";

export const sendOtp = async (req: Request, res: Response) => {
  const email = req.body.email || req.body.phone;
  if (!email) {
    return res.status(400).json({ message: "Email or Phone is required" });
  }

  try {
    const otp = generateOtp();

    // Save to Supabase (otp_codes table)
    const { error } = await supabase
      .from("otp_codes")
      .upsert({
        contact: email,
        code: otp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      }, { onConflict: 'contact' });

    if (error) {
      console.error("Supabase UPSERT Error:", error);
      throw error;
    }

    // Send Email (or SMS in future)
    // If it's an email, send it
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
    // Find latest OTP for this contact
    const { data: existingOtp, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("contact", contact)
      .eq("code", otp)
      .single();

    if (fetchError || !existingOtp) {
      return res.status(400).json({ verified: false, message: "Invalid or incorrect OTP" });
    }

    // Check expiry
    if (new Date(existingOtp.expires_at) < new Date()) {
      return res.status(400).json({ verified: false, message: "OTP has expired" });
    }

    // Check if user exists
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${contact},phone.eq.${contact}`)
      .single();

    // Consume OTP (delete it)
    await supabase.from("otp_codes").delete().eq("id", existingOtp.id);

    let token = null;
    if (user) {
      // Generate session token for existing user
      token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: "30d" }
      );
    }

    res.status(200).json({
      verified: true,
      userExists: !!user,
      token,
      user: user || null
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Verification process failed" });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { user, token } = await signupUser(req.body);

    res.status(201).json({
      message: "Signup success",
      user,
      token
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
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
