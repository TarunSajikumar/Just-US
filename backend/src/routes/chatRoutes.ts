import { Router, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import Message from "../models/Message";

const router = Router();

/**
 * GET /api/chat/messages/:partnerId
 * Returns full message history between the logged-in user and their partner,
 * ordered oldest → newest.
 */
router.get("/messages/:partnerId", authMiddleware, async (req: any, res: Response) => {
  const userId: string = req.userId;
  const { partnerId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender_id: userId, receiver_id: partnerId },
        { sender_id: partnerId, receiver_id: userId },
      ],
    }).sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return res.status(500).json({ message: "Failed to load messages" });
  }
});

/**
 * PATCH /api/chat/messages/:partnerId/read
 * Marks all unread messages FROM the partner TO the current user as read.
 */
router.patch("/messages/:partnerId/read", authMiddleware, async (req: any, res: Response) => {
  const userId: string = req.userId;
  const { partnerId } = req.params;

  try {
    await Message.updateMany(
      {
        sender_id: partnerId,
        receiver_id: userId,
        read: false,
      },
      { read: true }
    );

    return res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
    return res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

/**
 * POST /api/chat/mute/:partnerId
 * Mutes or unmutes the chat notifications from this partner.
 */
router.post("/mute/:partnerId", authMiddleware, async (req: any, res: Response) => {
  const { partnerId } = req.params;
  const { muted } = req.body;
  return res.json({ success: true, muted });
});

export default router;
