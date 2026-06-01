import mongoose, { Schema, Document } from "mongoose";

export interface IAchievement extends Document {
  coupleId: mongoose.Types.ObjectId;
  code: string;
  unlockedAt: Date;
}

const AchievementSchema = new Schema(
  {
    coupleId: {
      type: Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
    },
    code: {
      type: String,
      required: true,
      enum: ["FIRST_CONNECTION", "FIRST_MEMORY", "FIRST_NOTE", "100_DAYS", "365_DAYS"],
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate achievements for the same couple
AchievementSchema.index({ coupleId: 1, code: 1 }, { unique: true });

export default mongoose.model<IAchievement>("Achievement", AchievementSchema);
