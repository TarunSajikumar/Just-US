import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  coupleId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actionType:
    | "goal_created"
    | "goal_updated"
    | "goal_completed"
    | "poll_created"
    | "poll_voted"
    | "mood_updated"
    | "love_note_sent"
    | "memory_added"
    | "timeline_added"
    | "miss_you_ping";
  details: Record<string, any>;
}

const ActivitySchema = new Schema(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: "Couple", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actionType: {
      type: String,
      enum: [
        "goal_created",
        "goal_updated",
        "goal_completed",
        "poll_created",
        "poll_voted",
        "mood_updated",
        "love_note_sent",
        "memory_added",
        "timeline_added",
        "miss_you_ping",
      ],
      required: true,
    },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ActivitySchema.index({ coupleId: 1, createdAt: -1 });

export default mongoose.model<IActivity>("Activity", ActivitySchema);
