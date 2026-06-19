import mongoose from "mongoose";

const quickLoveMessageSchema = new mongoose.Schema(
  {
    couple_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    emoji: {
      type: String,
      default: "💕",
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const QuickLoveMessage = mongoose.model("QuickLoveMessage", quickLoveMessageSchema);

export default QuickLoveMessage;
