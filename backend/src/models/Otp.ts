import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    contact: {
      type: String,
      required: true,
      unique: true,
    },

    code: String,

    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Otp", otpSchema);
