import mongoose from "mongoose";

const appLockSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    isLockEnabled: {
      type: Boolean,
      default: false,
    },
    lockType: {
      type: String,
      enum: ["pin", "biometric"],
      default: "pin",
    },
    pinHash: {
      type: String,
      nullable: true,
      select: false,
    },
    biometricEnabled: {
      type: Boolean,
      default: false,
    },
    biometricType: {
      type: String,
      enum: ["fingerprint", "faceId", "iris"],
      nullable: true,
    },
    lockOnAppStart: {
      type: Boolean,
      default: true,
    },
    lockOnAppBackground: {
      type: Boolean,
      default: true,
    },
    lockTimeoutMinutes: {
      type: Number,
      default: 5,
      min: 1,
      max: 60,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      nullable: true,
    },
    lastUnlockTime: {
      type: Date,
      nullable: true,
    },
    timestamps: true,
  },
  { timestamps: true }
);

export default mongoose.model("AppLockSettings", appLockSettingsSchema);
