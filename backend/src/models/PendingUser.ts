import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      default: null, // Only set after email verification
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiresAt: {
      type: Date,
      required: true,
    },
    email_verified: {
      type: Boolean,
      default: false, // Marks when email OTP is verified
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete after 1 hour if not verified
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.model("PendingUser", pendingUserSchema);
