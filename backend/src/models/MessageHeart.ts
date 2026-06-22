import mongoose from "mongoose";

const messageHeartSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
      index: true,
    },
    heartType: {
      type: String,
      enum: ["heart", "loved", "laughed", "surprised", "sad", "angry"],
      default: "heart",
    },
    timestamps: true,
  },
  { timestamps: true }
);

// Ensure one heart per user per message
messageHeartSchema.index({ messageId: 1, userId: 1 }, { unique: true });
messageHeartSchema.index({ coupleId: 1, createdAt: -1 });

export default mongoose.model("MessageHeart", messageHeartSchema);
