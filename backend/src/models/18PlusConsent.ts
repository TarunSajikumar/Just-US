import mongoose from "mongoose";

const eighteenPlusConsentSchema = new mongoose.Schema(
  {
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
      index: true,
      unique: true,
    },
    requester: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      requestedAt: {
        type: Date,
        default: Date.now,
      },
      message: {
        type: String,
        default: "",
      },
    },
    responder: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        nullable: true,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      respondedAt: {
        type: Date,
        nullable: true,
      },
      message: {
        type: String,
        default: "",
      },
    },
    overallStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "revoked"],
      default: "pending",
      index: true,
    },
    activatedAt: {
      type: Date,
      nullable: true,
    },
    revokedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        nullable: true,
      },
      revokedAt: {
        type: Date,
        nullable: true,
      },
      reason: {
        type: String,
        default: "",
      },
    },
    timestamps: true,
  },
  { timestamps: true }
);

// Ensure only one consent record per couple
eighteenPlusConsentSchema.index({ coupleId: 1 }, { unique: true });

export default mongoose.model("18PlusConsent", eighteenPlusConsentSchema);
