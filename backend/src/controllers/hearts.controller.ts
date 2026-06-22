import { Request, Response } from "express";
import mongoose from "mongoose";
import MessageHeart from "../models/MessageHeart";
import Message from "../models/Message";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO } from "../sockets";

/**
 * POST /api/hearts/add
 * Add or toggle a heart reaction to a message
 */
export const addHeart = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId, heartType } = req.body;

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Valid messageId is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "User not in a couple" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const type = heartType || "heart";

    // Check if heart already exists
    const existingHeart = await MessageHeart.findOne({
      messageId,
      userId,
    });

    if (existingHeart) {
      if (existingHeart.heartType === type) {
        // Remove heart if same type (toggle)
        await MessageHeart.deleteOne({ _id: existingHeart._id });

        // Notify partner
        const io = getIO();
        if (io) {
          const room = [message.sender_id.toString(), message.receiver_id?.toString()].sort().join("-");
          io.to(room).emit("message_heart_removed", {
            messageId,
            userId,
            heartType: type,
          });
        }

        return res.json({ success: true, added: false });
      } else {
        // Update heart type
        existingHeart.heartType = type;
        await existingHeart.save();

        // Notify partner
        const io = getIO();
        if (io) {
          const room = [message.sender_id.toString(), message.receiver_id?.toString()].sort().join("-");
          io.to(room).emit("message_heart_changed", {
            messageId,
            userId,
            heartType: type,
          });
        }

        return res.json({ success: true, added: true, heartType: type });
      }
    }

    // Create new heart
    const heart = await MessageHeart.create({
      messageId,
      userId,
      coupleId: user.couple_id,
      heartType: type,
    });

    // Notify partner via socket
    const io = getIO();
    if (io) {
      const room = [message.sender_id.toString(), message.receiver_id?.toString()].sort().join("-");
      io.to(room).emit("message_heart_added", {
        messageId,
        userId,
        heartType: type,
        addedAt: heart.createdAt,
      });
    }

    return res.status(201).json({
      success: true,
      added: true,
      heart,
    });
  } catch (error) {
    console.error("addHeart error:", error);
    return res.status(500).json({ message: "Failed to add heart" });
  }
};

/**
 * DELETE /api/hearts/:messageId
 * Remove heart reaction from a message
 */
export const removeHeart = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Valid messageId is required" });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const result = await MessageHeart.findOneAndDelete({
      messageId,
      userId,
    });

    if (!result) {
      return res.status(404).json({ message: "Heart not found" });
    }

    // Notify partner
    const io = getIO();
    if (io) {
      const room = [message.sender_id.toString(), message.receiver_id?.toString()].sort().join("-");
      io.to(room).emit("message_heart_removed", {
        messageId,
        userId,
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("removeHeart error:", error);
    return res.status(500).json({ message: "Failed to remove heart" });
  }
};

/**
 * GET /api/hearts/:messageId
 * Get all heart reactions for a message
 */
export const getMessageHearts = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Valid messageId is required" });
  }

  try {
    const hearts = await MessageHeart.find({ messageId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const userHeart = hearts.find((h) => h.userId.toString() === userId);

    // Group hearts by type
    const grouped = hearts.reduce(
      (acc: any, heart) => {
        const type = heart.heartType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push({
          userId: heart.userId._id,
          userName: (heart.userId as any).name,
          addedAt: heart.createdAt,
        });
        return acc;
      },
      {} as Record<string, any[]>
    );

    return res.json({
      hearts: grouped,
      myHeart: userHeart ? userHeart.heartType : null,
      totalHearts: hearts.length,
    });
  } catch (error) {
    console.error("getMessageHearts error:", error);
    return res.status(500).json({ message: "Failed to fetch hearts" });
  }
};

/**
 * GET /api/hearts/count/:messageId
 * Get heart count for a message
 */
export const getHeartCount = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Valid messageId is required" });
  }

  try {
    const counts = await MessageHeart.aggregate([
      { $match: { messageId: new mongoose.Types.ObjectId(messageId) } },
      { $group: { _id: "$heartType", count: { $sum: 1 } } },
    ]);

    const result = counts.reduce(
      (acc: any, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<string, number>
    );

    return res.json({
      counts: result,
      total: counts.reduce((sum, item) => sum + item.count, 0),
    });
  } catch (error) {
    console.error("getHeartCount error:", error);
    return res.status(500).json({ message: "Failed to fetch heart count" });
  }
};
