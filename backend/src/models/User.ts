import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: String,

    phone: String,

    name: String,

    birthday: Date,

    gender: String,

    relationship_status: {
      type: String,
      default: "none",
    },

    partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    couple_id: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
