import mongoose, { Schema, Document } from "mongoose";

export interface IGoal extends Document {
  coupleId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  emoji: string;
  target: number;
  current: number;
  completed: boolean;
  completedAt?: Date;
}

const GoalSchema = new Schema(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: "Couple", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, maxlength: 200 },
    emoji: { type: String, default: "🎯" },
    target: { type: Number, required: true, min: 1 },
    current: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IGoal>("Goal", GoalSchema);
