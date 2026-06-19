import mongoose, { Schema } from "mongoose";

const couplePositionSchema = new Schema(
  {
    coupleId: {
      type: Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
    },
    positionId: {
      type: String,
      required: true,
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    wantToTry: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tried: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

couplePositionSchema.index({ coupleId: 1, positionId: 1 }, { unique: true });

export default mongoose.model("CouplePosition", couplePositionSchema);
