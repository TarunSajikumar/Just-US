import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Message from "../models/Message";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO } from "../sockets";

/**
 * GET /api/messages/:partnerId
 * Returns paginated chat history between the current user and their partner.
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string;
  const partnerId = req.params.partnerId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string | undefined;

  if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
    return res.status(400).json({ message: "Valid partnerId is required" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    let query: any = {
      $or: [
        { sender_id: userObjectId, receiver_id: partnerObjectId },
        { sender_id: partnerObjectId, receiver_id: userObjectId },
      ],
      deleted_by: { $ne: userObjectId }
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Mark messages from partner as read
    const result = await Message.updateMany(
      { sender_id: partnerObjectId, receiver_id: userObjectId, read: false },
      { $set: { read: true, status: 'read' } }
    );

    if (result.modifiedCount > 0) {
      const io = getIO();
      if (io) {
        const room = [userId, partnerId].sort().join("-");
        io.to(room).emit("messages_read", { readerId: userId });
      }
    }

    return res.json({
      messages: messages.reverse().map((m: any) => ({
        id: m._id,
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
        message: m.message,
        read: m.read,
        status: m.status || 'sent',
        media_url: m.media_url || null,
        media_type: m.media_type || null,
        reaction: m.reaction || null,
        reply_to: m.reply_to || null,
        is_voice: m.is_voice || false,
        voice_duration: m.voice_duration || 0,
        is_pinned: m.is_pinned || false,
        is_saved: m.is_saved_by?.some((id: any) => id.toString() === userId.toString()) || false,
        is_edited: m.is_edited || false,
        created_at: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
};

/**
 * POST /api/messages
 * Persists a new text message to the database.
 * Body: { partnerId, message, reply_to? }
 */
export const createMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { partnerId, message, reply_to } = req.body;

  if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId) || !message?.trim()) {
    return res.status(400).json({ message: "Valid partnerId and message are required" });
  }

  try {
    const io = getIO();
    let status = 'sent';
    if (io) {
      const partnerRoom = io.sockets.adapter.rooms.get(partnerId);
      if (partnerRoom && partnerRoom.size > 0) {
        status = 'delivered';
      }
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    const newMessage: any = await Message.create({
      sender_id: userObjectId,
      receiver_id: partnerObjectId,
      message: message.trim(),
      reply_to: reply_to || null,
      status: status as any,
    });

    return res.status(201).json({
      message: {
        id: newMessage._id,
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        message: newMessage.message,
        read: newMessage.read,
        status: status,
        reply_to: newMessage.reply_to || null,
        is_voice: newMessage.is_voice || false,
        voice_duration: newMessage.voice_duration || 0,
        is_pinned: newMessage.is_pinned || false,
        is_saved: false,
        is_edited: false,
        created_at: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("createMessage error:", error);
    return res.status(500).json({ message: "Failed to save message" });
  }
};

/**
 * PATCH /api/messages/:partnerId/read
 * Marks all messages from the partner as read.
 */
export const markMessagesRead = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string;
  const partnerId = req.params.partnerId as string;

  if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
    return res.status(400).json({ message: "Valid partnerId is required" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    const result = await Message.updateMany(
      { sender_id: partnerObjectId, receiver_id: userObjectId, read: false },
      { $set: { read: true, status: 'read' } }
    );

    if (result.modifiedCount > 0) {
      const io = getIO();
      if (io) {
        const room = [userId, partnerId].sort().join("-");
        io.to(room).emit("messages_read", { readerId: userId });
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("markMessagesRead error:", error);
    return res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

/**
 * DELETE /api/messages/:messageId
 * Delete a message (only by sender).
 */
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;

  try {
    const message = await Message.findOne({ _id: messageId, sender_id: userId });
    if (!message) {
      return res.status(404).json({ message: "Message not found or not authorized" });
    }

    await Message.deleteOne({ _id: messageId });

    // Emit socket event to partner
    const io = getIO();
    if (io && message.receiver_id) {
      const room = [userId, message.receiver_id.toString()].sort().join("-");
      io.to(room).emit("message_deleted", { messageId });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("deleteMessage error:", error);
    return res.status(500).json({ message: "Failed to delete message" });
  }
};

/**
 * GET /api/messages/search
 * Search messages by query text.
 * Query params: partnerId, q
 */
export const searchMessages = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { partnerId, q } = req.query as { partnerId: string; q: string };

  if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId) || !q?.trim()) {
    return res.status(400).json({ message: "Valid partnerId and q are required" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    const messages = await Message.find({
      $or: [
        { sender_id: userObjectId, receiver_id: partnerObjectId },
        { sender_id: partnerObjectId, receiver_id: userObjectId },
      ],
      message: { $regex: q.trim(), $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({
      messages: messages.map((m: any) => ({
        id: m._id,
        sender_id: m.sender_id,
        message: m.message,
        read: m.read,
        created_at: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("searchMessages error:", error);
    return res.status(500).json({ message: "Failed to search messages" });
  }
};

/**
 * POST /api/messages/:messageId/reaction
 * Add or toggle an emoji reaction on a message.
 * Body: { reaction }
 */
export const addReaction = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;
  const { reaction } = req.body;

  if (!reaction) {
    return res.status(400).json({ message: "reaction is required" });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Toggle: if same reaction, remove; otherwise set new
    const newReaction = (message as any).reaction === reaction ? null : reaction;
    (message as any).reaction = newReaction;
    await message.save();

    // Emit socket event to partner
    const io = getIO();
    const receiverId = message.sender_id.toString() === userId
      ? message.receiver_id?.toString()
      : message.sender_id.toString();

    if (io && receiverId) {
      const room = [userId, receiverId].sort().join("-");
      io.to(room).emit("message_reaction", { messageId, reaction: newReaction });
    }

    return res.json({ success: true, reaction: newReaction });
  } catch (error) {
    console.error("addReaction error:", error);
    return res.status(500).json({ message: "Failed to add reaction" });
  }
};

/**
 * POST /api/messages/media
 * Uploads media (photo/video) to Cloudinary and saves message.
 */
export const uploadMediaMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { partnerId, mediaType, voiceDuration } = req.body;

  if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId) || !mediaType) {
    return res.status(400).json({ message: "Valid partnerId and mediaType are required" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const io = getIO();
    let status = 'sent';
    if (io) {
      const partnerRoom = io.sockets.adapter.rooms.get(partnerId);
      if (partnerRoom && partnerRoom.size > 0) {
        status = 'delivered';
      }
    }

    const durationNum = voiceDuration ? parseInt(voiceDuration, 10) : 0;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    const newMessage: any = await Message.create({
      sender_id: userObjectId,
      receiver_id: partnerObjectId,
      message: mediaType === 'photo' ? "📷 Sent a photo" : mediaType === 'video' ? "🎥 Sent a video" : mediaType === 'audio' ? "🎤 Voice message" : "📄 Sent a document",
      media_url: req.file.path,
      media_type: mediaType,
      is_voice: mediaType === 'audio',
      voice_duration: durationNum,
      status: status as any,
    });

    return res.status(201).json({
      message: {
        id: newMessage._id,
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        message: newMessage.message,
        read: newMessage.read,
        status: status,
        media_url: newMessage.media_url,
        media_type: newMessage.media_type,
        is_voice: newMessage.is_voice || false,
        voice_duration: newMessage.voice_duration || 0,
        is_pinned: newMessage.is_pinned || false,
        is_saved: false,
        is_edited: false,
        created_at: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("uploadMediaMessage error:", error);
    return res.status(500).json({ message: "Failed to save media message" });
  }
};

/**
 * POST /api/messages/pin/:messageId
 * Pins a message.
 */
export const pinMessage = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  try {
    const msg = await Message.findByIdAndUpdate(messageId, { is_pinned: true }, { new: true });
    if (!msg) return res.status(404).json({ message: "Message not found" });
    return res.json(msg);
  } catch (error) {
    console.error("pinMessage error:", error);
    return res.status(500).json({ message: "Failed to pin message" });
  }
};

/**
 * DELETE /api/messages/pin/:messageId
 * Unpins a message.
 */
export const unpinMessage = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  try {
    const msg = await Message.findByIdAndUpdate(messageId, { is_pinned: false }, { new: true });
    if (!msg) return res.status(404).json({ message: "Message not found" });
    return res.json(msg);
  } catch (error) {
    console.error("unpinMessage error:", error);
    return res.status(500).json({ message: "Failed to unpin message" });
  }
};

/**
 * GET /api/messages/pinned/:partnerId
 * Gets pinned messages between current user and partner.
 */
export const getPinnedMessages = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string;
  const partnerId = req.params.partnerId as string;

  if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
    return res.status(400).json({ message: "Valid partnerId is required" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    const messages = await Message.find({
      $or: [
        { sender_id: userObjectId, receiver_id: partnerObjectId },
        { sender_id: partnerObjectId, receiver_id: userObjectId },
      ],
      is_pinned: true,
      deleted_by: { $ne: userObjectId }
    }).sort({ createdAt: -1 });

    return res.json(messages.map((m: any) => ({
      id: m._id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      message: m.message,
      read: m.read,
      status: m.status || 'sent',
      media_url: m.media_url || null,
      media_type: m.media_type || null,
      reaction: m.reaction || null,
      reply_to: m.reply_to || null,
      is_voice: m.is_voice || false,
      voice_duration: m.voice_duration || 0,
      is_pinned: m.is_pinned || false,
      is_saved: m.is_saved_by?.some((id: any) => id.toString() === userId.toString()) || false,
      is_edited: m.is_edited || false,
      created_at: m.createdAt,
    })));
  } catch (error) {
    console.error("getPinnedMessages error:", error);
    return res.status(500).json({ message: "Failed to fetch pinned messages" });
  }
};

/**
 * POST /api/messages/save/:messageId
 * Saves a message for the user.
 */
export const saveMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;
  try {
    const msg = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { is_saved_by: userId } },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Message not found" });
    return res.json(msg);
  } catch (error) {
    console.error("saveMessage error:", error);
    return res.status(500).json({ message: "Failed to save message" });
  }
};

/**
 * DELETE /api/messages/save/:messageId
 * Unsaves a message for the user.
 */
export const unsaveMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;
  try {
    const msg = await Message.findByIdAndUpdate(
      messageId,
      { $pull: { is_saved_by: userId } },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Message not found" });
    return res.json(msg);
  } catch (error) {
    console.error("unsaveMessage error:", error);
    return res.status(500).json({ message: "Failed to unsave message" });
  }
};

/**
 * GET /api/messages/saved/:partnerId
 * Gets saved messages between current user and partner.
 */
export const getSavedMessages = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string;
  const partnerId = req.params.partnerId as string;

  if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
    return res.status(400).json({ message: "Valid partnerId is required" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    const messages = await Message.find({
      $or: [
        { sender_id: userObjectId, receiver_id: partnerObjectId },
        { sender_id: partnerObjectId, receiver_id: userObjectId },
      ],
      is_saved_by: userObjectId,
      deleted_by: { $ne: userObjectId }
    }).sort({ createdAt: -1 });

    return res.json(messages.map((m: any) => ({
      id: m._id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      message: m.message,
      read: m.read,
      status: m.status || 'sent',
      media_url: m.media_url || null,
      media_type: m.media_type || null,
      reaction: m.reaction || null,
      reply_to: m.reply_to || null,
      is_voice: m.is_voice || false,
      voice_duration: m.voice_duration || 0,
      is_pinned: m.is_pinned || false,
      is_saved: true,
      is_edited: m.is_edited || false,
      created_at: m.createdAt,
    })));
  } catch (error) {
    console.error("getSavedMessages error:", error);
    return res.status(500).json({ message: "Failed to fetch saved messages" });
  }
};

/**
 * PUT /api/messages/:messageId
 * Edits a message text.
 */
export const editMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "message text is required" });
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: messageId, sender_id: userId },
      { message: message.trim(), is_edited: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Message not found or not authorized to edit" });

    // Emit socket event to partner
    const io = getIO();
    if (io && msg.receiver_id) {
      const room = [userId, msg.receiver_id.toString()].sort().join("-");
      io.to(room).emit("message_edited", { messageId, message: msg.message });
    }

    return res.json(msg);
  } catch (error) {
    console.error("editMessage error:", error);
    return res.status(500).json({ message: "Failed to edit message" });
  }
};

/**
 * POST /api/messages/:messageId/delete-for-me
 * Deletes a message for the current user only.
 */
export const deleteMessageForMe = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;
  try {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deleted_by: userId }
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("deleteMessageForMe error:", error);
    return res.status(500).json({ message: "Failed to delete message for me" });
  }
};

/**
 * POST /api/messages/:messageId/forward
 * Forwards a message to another user.
 */
export const forwardMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { messageId } = req.params;
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ message: "targetUserId is required" });
  }
  try {
    const original = await Message.findById(messageId);
    if (!original) {
      return res.status(404).json({ message: "Original message not found" });
    }
    const io = getIO();
    let status = 'sent';
    if (io) {
      const partnerRoom = io.sockets.adapter.rooms.get(targetUserId);
      if (partnerRoom && partnerRoom.size > 0) {
        status = 'delivered';
      }
    }
    const forwarded: any = await Message.create({
      sender_id: userId,
      receiver_id: targetUserId,
      message: original.message,
      media_url: original.media_url,
      media_type: original.media_type,
      is_voice: original.is_voice,
      voice_duration: original.voice_duration,
      status: status as any,
    });

    const room = [userId, targetUserId].sort().join("-");
    if (io) {
      io.to(room).emit("message", {
        id: forwarded._id,
        senderId: userId,
        receiverId: targetUserId,
        message: forwarded.message,
        media_url: forwarded.media_url,
        media_type: forwarded.media_type,
        is_voice: forwarded.is_voice,
        voice_duration: forwarded.voice_duration,
        status: status,
        createdAt: forwarded.createdAt,
      });
    }

    return res.json({ success: true, message: forwarded });
  } catch (error) {
    console.error("forwardMessage error:", error);
    return res.status(500).json({ message: "Failed to forward message" });
  }
};

/**
 * GET /api/messages/unread/:partnerId
 * Gets the number of unread messages from a partner.
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string;
  const partnerId = req.params.partnerId as string;

  if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
    return res.status(400).json({ message: "Valid partnerId is required" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    const count = await Message.countDocuments({
      sender_id: partnerObjectId,
      receiver_id: userObjectId,
      read: false,
      deleted_by: { $ne: userObjectId }
    });
    return res.json({ count });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return res.status(500).json({ message: "Failed to get unread count" });
  }
};
