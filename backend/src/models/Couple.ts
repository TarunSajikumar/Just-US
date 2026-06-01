import mongoose from "mongoose";

const coupleSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    relationshipStartDate: {
      type: Date,
      default: Date.now,
    },
    anniversaryDate: {
      type: Date,
      default: null,
    },
    nextMeetDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Couple", coupleSchema);
