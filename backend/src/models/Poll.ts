import mongoose, { Schema, Document } from "mongoose";

export interface IPoll extends Document {
  coupleId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  votes: Record<string, number>; // optionIndex -> count
  userVote?: Record<string, number>; // userId -> optionIndex
  endsAt: Date;
  expired: boolean;
}

const PollSchema = new Schema(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: "Couple", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true, maxlength: 300 },
    options: [{ type: String, required: true }],
    votes: { type: Schema.Types.Mixed, default: {} }, // { userId: optionIndex }
    endsAt: { type: Date, required: true },
    expired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IPoll>("Poll", PollSchema);
