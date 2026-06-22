import mongoose from "mongoose";

const periodTrackerSchema = new mongoose.Schema(
  {
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
    lastPeriodDate: {
      type: Date,
      required: true,
    },
    cycleLengthDays: {
      type: Number,
      required: true,
      min: 21,
      max: 35,
      default: 28,
    },
    periodDurationDays: {
      type: Number,
      required: true,
      min: 2,
      max: 7,
      default: 5,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    reminders: {
      periodStarting: { type: Boolean, default: true },
      ovulationDay: { type: Boolean, default: false },
      pmsReminder: { type: Boolean, default: true },
    },
    history: [
      {
        startDate: Date,
        endDate: Date,
        flow: { type: String, enum: ["light", "normal", "heavy"], default: "normal" },
        symptoms: [String],
        notes: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    timestamps: true,
  },
  { timestamps: true }
);

// Index for efficient querying
periodTrackerSchema.index({ userId: 1, coupleId: 1 });
periodTrackerSchema.index({ userId: 1, lastPeriodDate: -1 });

export default mongoose.model("PeriodTracker", periodTrackerSchema);
