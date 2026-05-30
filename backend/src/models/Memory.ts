import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    couple_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Memory", memorySchema);
