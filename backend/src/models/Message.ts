import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    couple_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Couple",
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    media_url: {
      type: String,
      default: null,
    },
    media_type: {
      type: String,
      enum: ['photo', 'video', 'audio', 'document', null],
      default: null,
    },
    reaction: {
      type: String,
      default: null,
    },
    reply_to: {
      type: String,
      default: null,
    },
    is_voice: {
      type: Boolean,
      default: false,
    },
    voice_duration: {
      type: Number,
      default: 0,
    },
    is_pinned: {
      type: Boolean,
      default: false,
    },
    is_saved_by: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    is_edited: {
      type: Boolean,
      default: false,
    },
    deleted_by: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: true,
  }
);

// Index for fast partner-based chat history queries
messageSchema.index({ sender_id: 1, receiver_id: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
