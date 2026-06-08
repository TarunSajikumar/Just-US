import mongoose, { Schema, Document } from "mongoose";

export interface IMood extends Document {
  userId: mongoose.Types.ObjectId;
  coupleId: mongoose.Types.ObjectId;
  mood: string;
  emoji?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MoodSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coupleId: {
      type: Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
    },
    mood: {
      type: String,
      required: true,
    },
    emoji: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMood>("Mood", MoodSchema);
