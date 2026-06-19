import mongoose, { Schema } from "mongoose";

const coupleIdeaSchema = new Schema(
  {
    coupleId: {
      type: Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
    },
    ideaId: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

coupleIdeaSchema.index({ coupleId: 1, ideaId: 1 }, { unique: true });

export default mongoose.model("CoupleIdea", coupleIdeaSchema);
