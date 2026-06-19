import mongoose, { Schema } from "mongoose";

const coupleChallengeSchema = new Schema(
  {
    coupleId: {
      type: Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
    },
    challengeId: {
      type: String,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

coupleChallengeSchema.index({ coupleId: 1, challengeId: 1 }, { unique: true });

export default mongoose.model("CoupleChallenge", coupleChallengeSchema);
