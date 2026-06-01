import { Response } from "express";
import Invite from "../models/Invite";
import Couple from "../models/Couple";
import User from "../models/User";
import { unlockAchievement } from "../services/achievement.service";

/**
 * POST /api/invite/create
 * Generates a unique 6-char invite code for the authenticated user.
 * Response: { "success": true, "code": "AB12CD" }
 */
export const createInvite = async (req: any, res: Response) => {
  const userId: string = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    // Invalidate any previous pending invites from this user
    await Invite.updateMany(
      { created_by: userId, status: "pending" },
      { status: "cancelled" }
    );

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const invite = await Invite.create({
      code,
      created_by: userId,
      status: "pending",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return res.json({ success: true, code: invite.code });
  } catch (err) {
    console.error("createInvite error:", err);
    return res.status(500).json({ success: false, message: "Error generating invite code" });
  }
};

/**
 * POST /api/invite/join
 * Body: { "inviteCode": "AB12CD" }
 * Validates the code, creates a couple, and links both users.
 */
export const joinInvite = async (req: any, res: Response) => {
  const userId: string = req.userId;
  const { inviteCode } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!inviteCode) return res.status(400).json({ message: "inviteCode is required" });

  try {
    // 1. Find the pending invite
    const invite = await Invite.findOne({
      code: inviteCode.toUpperCase().trim(),
      status: "pending",
    });

    if (!invite) {
      return res.status(404).json({ message: "Invalid or expired invite code" });
    }

    if (invite.created_by.toString() === userId) {
      return res.status(400).json({ message: "You cannot use your own invite code" });
    }

    const creatorId = invite.created_by;

    // 2. Create a new couple record
    const couple = await Couple.create({
      users: [userId, creatorId],
    });

    const coupleId = couple._id;

    // 3. Mark invite as used
    invite.status = "used";
    invite.used_by = userId as any;
    await invite.save();

    // 4. Update both users: set couple_id + relationship_status + partner_id
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        couple_id: coupleId.toString(),
        partner_id: creatorId,
        relationship_status: "couple",
      }),
      User.findByIdAndUpdate(creatorId, {
        couple_id: coupleId.toString(),
        partner_id: userId,
        relationship_status: "couple",
      }),
    ]);

    // Unlock FIRST_CONNECTION achievement
    await unlockAchievement(coupleId.toString(), "FIRST_CONNECTION");

    return res.json({
      success: true,
      message: "Successfully connected with your partner! 💑",
      coupleId,
    });
  } catch (err) {
    console.error("joinInvite exception:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
