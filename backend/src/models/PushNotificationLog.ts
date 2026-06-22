import mongoose from "mongoose";

const pushNotificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    notificationType: {
      type: String,
      enum: [
        "message",
        "love_note",
        "memory",
        "heart_reaction",
        "quick_love",
        "period_reminder",
        "period_starting",
        "ovulation_day",
        "pms_reminder",
        "18plus_request",
        "event_reminder",
        "partner_online",
        "other",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "delivery_confirmed"],
      default: "pending",
    },
    fcmToken: {
      type: String,
      nullable: true,
    },
    error: {
      type: String,
      nullable: true,
    },
    sentAt: {
      type: Date,
      nullable: true,
    },
    deliveredAt: {
      type: Date,
      nullable: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    timestamps: true,
  },
  { timestamps: true }
);

// Index for efficient queries
pushNotificationLogSchema.index({ userId: 1, createdAt: -1 });
pushNotificationLogSchema.index({ status: 1, createdAt: -1 });
pushNotificationLogSchema.index({ notificationType: 1, userId: 1 });

export default mongoose.model("PushNotificationLog", pushNotificationLogSchema);
