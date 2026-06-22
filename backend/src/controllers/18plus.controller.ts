import { Request, Response } from "express";
import EighteenPlusConsent from "../models/18PlusConsent";
import User from "../models/User";
import Couple from "../models/Couple";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO } from "../sockets";

/**
 * POST /api/18plus/request
 * Request 18+ mode from partner
 */
export const requestEighteenPlusMode = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { message } = req.body;

  try {
    const user = await User.findById(userId).populate("partner_id");
    if (!user || !user.partner_id || !user.couple_id) {
      return res.status(400).json({ message: "No active couple relationship" });
    }

    let consent = await EighteenPlusConsent.findOne({ coupleId: user.couple_id });

    if (consent && consent.overallStatus === "accepted") {
      return res.status(400).json({ message: "18+ mode already active for this couple" });
    }

    if (consent && consent.overallStatus === "pending") {
      return res.status(400).json({ message: "Request already pending" });
    }

    consent = await EighteenPlusConsent.findOneAndUpdate(
      { coupleId: user.couple_id },
      {
        coupleId: user.couple_id,
        requester: {
          userId,
          requestedAt: new Date(),
          message: message || "",
        },
        responder: {
          userId: user.partner_id._id,
          status: "pending",
        },
        overallStatus: "pending",
      },
      { upsert: true, new: true }
    );

    // Notify partner via socket
    const io = getIO();
    if (io) {
      io.to(user.partner_id._id.toString()).emit("18plus_request_received", {
        coupleId: user.couple_id,
        requesterId: userId,
        requesterName: user.name,
        message: message || "",
        requestedAt: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Request sent to partner",
      consent,
    });
  } catch (error) {
    console.error("requestEighteenPlusMode error:", error);
    return res.status(500).json({ message: "Failed to send request" });
  }
};

/**
 * POST /api/18plus/accept
 * Accept 18+ mode request
 */
export const acceptEighteenPlusMode = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "No active couple relationship" });
    }

    const consent = await EighteenPlusConsent.findOne({ coupleId: user.couple_id });
    if (!consent) {
      return res.status(404).json({ message: "No pending request" });
    }

    if (consent.overallStatus !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    consent.responder.userId = userId;
    consent.responder.status = "accepted";
    consent.responder.respondedAt = new Date();
    consent.overallStatus = "accepted";
    consent.activatedAt = new Date();

    await consent.save();

    // Notify partner via socket
    const io = getIO();
    if (io && consent.requester.userId) {
      io.to(consent.requester.userId.toString()).emit("18plus_request_accepted", {
        coupleId: user.couple_id,
        acceptedBy: userId,
        activatedAt: consent.activatedAt,
      });
    }

    return res.json({
      success: true,
      message: "18+ mode activated",
      consent,
    });
  } catch (error) {
    console.error("acceptEighteenPlusMode error:", error);
    return res.status(500).json({ message: "Failed to accept request" });
  }
};

/**
 * POST /api/18plus/reject
 * Reject 18+ mode request
 */
export const rejectEighteenPlusMode = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { reason } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "No active couple relationship" });
    }

    const consent = await EighteenPlusConsent.findOne({ coupleId: user.couple_id });
    if (!consent) {
      return res.status(404).json({ message: "No pending request" });
    }

    if (consent.overallStatus !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    consent.responder.userId = userId;
    consent.responder.status = "rejected";
    consent.responder.respondedAt = new Date();
    consent.responder.message = reason || "";
    consent.overallStatus = "rejected";

    await consent.save();

    // Notify partner via socket
    const io = getIO();
    if (io && consent.requester.userId) {
      io.to(consent.requester.userId.toString()).emit("18plus_request_rejected", {
        coupleId: user.couple_id,
        rejectedBy: userId,
        reason: reason || "",
      });
    }

    return res.json({
      success: true,
      message: "Request rejected",
      consent,
    });
  } catch (error) {
    console.error("rejectEighteenPlusMode error:", error);
    return res.status(500).json({ message: "Failed to reject request" });
  }
};

/**
 * POST /api/18plus/revoke
 * Revoke 18+ mode (by either partner)
 */
export const revokeEighteenPlusMode = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { reason } = req.body;

  try {
    const user = await User.findById(userId).populate("partner_id");
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "No active couple relationship" });
    }

    const consent = await EighteenPlusConsent.findOne({ coupleId: user.couple_id });
    if (!consent) {
      return res.status(404).json({ message: "No active consent" });
    }

    if (consent.overallStatus !== "accepted") {
      return res.status(400).json({ message: "18+ mode is not currently active" });
    }

    consent.overallStatus = "revoked";
    consent.revokedBy.userId = userId;
    consent.revokedBy.revokedAt = new Date();
    consent.revokedBy.reason = reason || "";

    await consent.save();

    // Notify partner via socket
    const io = getIO();
    if (io && user.partner_id) {
      io.to(user.partner_id._id.toString()).emit("18plus_mode_revoked", {
        coupleId: user.couple_id,
        revokedBy: userId,
        revokedByName: user.name,
        reason: reason || "",
      });
    }

    return res.json({
      success: true,
      message: "18+ mode revoked",
      consent,
    });
  } catch (error) {
    console.error("revokeEighteenPlusMode error:", error);
    return res.status(500).json({ message: "Failed to revoke consent" });
  }
};

/**
 * GET /api/18plus/status
 * Get current 18+ mode status for couple
 */
export const getEighteenPlusStatus = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "No active couple relationship" });
    }

    const consent = await EighteenPlusConsent.findOne({ coupleId: user.couple_id });
    if (!consent) {
      return res.json({
        status: "not_requested",
        consent: null,
      });
    }

    return res.json({
      status: consent.overallStatus,
      consent,
    });
  } catch (error) {
    console.error("getEighteenPlusStatus error:", error);
    return res.status(500).json({ message: "Failed to fetch status" });
  }
};
