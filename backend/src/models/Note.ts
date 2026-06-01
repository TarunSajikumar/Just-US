import mongoose, { Schema, Document } from "mongoose";

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  coupleId: mongoose.Types.ObjectId;
  content: string;
}

const NoteSchema = new Schema(
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
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<INote>("Note", NoteSchema);
