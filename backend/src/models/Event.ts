import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  coupleId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  eventDate: Date;
  eventType: "anniversary" | "trip" | "date" | "milestone" | "custom";
  emoji: string;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: "Couple", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    eventDate: { type: Date, required: true },
    eventType: {
      type: String,
      enum: ["anniversary", "trip", "date", "milestone", "custom"],
      default: "custom",
    },
    emoji: { type: String, default: "📅" },
  },
  { timestamps: true }
);

// Index for fast couple+date queries
EventSchema.index({ coupleId: 1, eventDate: 1 });

export default mongoose.model<IEvent>("Event", EventSchema);
