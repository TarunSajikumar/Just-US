import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    used_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "used", "cancelled"],
      default: "pending",
    },
    expires_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Invite", inviteSchema);
