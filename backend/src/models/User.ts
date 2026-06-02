import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      index: true,
    },

    name: String,

    birthday: Date,

    gender: String,

    relationship_status: {
      type: String,
      default: "none",
    },

    relationship_mode: {
      type: String,
      default: "NONE",
    },

    invite_code: {
      type: String,
      default: null,
    },

    partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    couple_id: String,

    partnerNickname: {
      type: String,
      default: "",
    },

    partnerPingMessage: {
      type: String,
      default: "I miss you, where are you? ❤️",
    },

    fcmToken: {
      type: String,
      default: null,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: null,
    },

    notificationsEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
