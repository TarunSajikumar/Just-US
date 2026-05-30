import { Response } from "express";
import User from "../models/User";
import Message from "../models/Message";

/**
 * GET /api/messages/:coupleId
 * Returns paginated chat history for a couple.
 */
export const getMessages = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string | undefined;

  if (!coupleId) {
    return res.status(400).json({ message: "coupleId is required" });
  }

  try {
    // Verify user belongs to this couple
    const user = await User.findOne({ _id: userId, couple_id: coupleId });

    if (!user) {
      return res.status(403).json({ message: "Not authorized for this couple" });
    }

    let query: any = { couple_id: coupleId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit);

    // Mark messages as read (those not sent by current user)
    await Message.updateMany(
      { couple_id: coupleId, sender_id: { $ne: userId }, read: false },
      { read: true }
    );

    return res.json({
      messages: messages.reverse(), // oldest first for display
    });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
};

/**
 * POST /api/messages
 * Persists a new message to the database.
 * Body: { coupleId: string, message: string }
 */
export const createMessage = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId, message } = req.body;

  if (!coupleId || !message?.trim()) {
    return res.status(400).json({ message: "coupleId and message are required" });
  }

  try {
    // Verify user belongs to this couple
    const user = await User.findOne({ _id: userId, couple_id: coupleId });

    if (!user) {
      return res.status(403).json({ message: "Not authorized for this couple" });
    }

    const newMessage = await Message.create({
      couple_id: coupleId,
      sender_id: userId,
      message: message.trim(),
    });

    return res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error("createMessage error:", error);
    return res.status(500).json({ message: "Failed to save message" });
  }
};
