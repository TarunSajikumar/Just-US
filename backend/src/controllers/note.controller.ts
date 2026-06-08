import { Response } from "express";
import Note from "../models/Note";
import User from "../models/User";
import Activity from "../models/Activity";
import { unlockAchievement } from "../services/achievement.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO, getCoupleRoomId } from "../sockets";

export const saveNote = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.userId;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedNote = await Note.findOneAndUpdate(
      {
        userId: user._id,
        createdAt: { $gte: today },
      },
      {
        userId: user._id,
        coupleId: user.couple_id,
        content: content.trim(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Unlock FIRST_NOTE achievement
    await unlockAchievement(user.couple_id.toString(), "FIRST_NOTE");

    // Log Activity
    try {
      await Activity.create({
        coupleId: user.couple_id,
        actorId: user._id,
        actionType: "love_note_sent",
        details: { content: content.trim() },
      });
    } catch (_) {}

    // Real-time emit to partner
    try {
      const io = getIO();
      if (io && user.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("new_love_note", {
          content: content.trim(),
          createdAt: updatedNote.createdAt,
          actorName: user.name,
        });
      }
    } catch (_) {}

    res.json({
      success: true,
      note: updatedNote,
    });
  } catch (error) {
    console.error("Save note error:", error);
    res.status(500).json({ message: "Failed to save note" });
  }
};

export const getPartnerNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user?.partner_id) {
      return res.json(null);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const note = await Note.findOne({
      userId: user.partner_id,
      createdAt: { $gte: today },
    }).sort({ createdAt: -1 });

    res.json(note);
  } catch (error) {
    console.error("Get partner note error:", error);
    res.status(500).json({ message: "Failed to fetch note" });
  }
};

export const getAllNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }

    // Get all notes for the couple, sorted by date (newest first)
    const notes = await Note.find({
      coupleId: user.couple_id,
    }).sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    console.error("Get all notes error:", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
};
