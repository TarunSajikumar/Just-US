import { Response } from "express";
import Mood from "../models/Mood";
import User from "../models/User";
import Activity from "../models/Activity";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO, getCoupleRoomId } from "../sockets";

export const saveMood = async (req: AuthRequest, res: Response) => {
  try {
    const { mood, emoji } = req.body;
    const userId = req.userId;

    if (!mood) {
      return res.status(400).json({ message: "Mood is required" });
    }

    const user = await User.findById(userId);

    if (!user?.couple_id) {
      return res.status(400).json({
        message: "Not connected to a couple",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedMood = await Mood.findOneAndUpdate(
      {
        userId: user._id,
        createdAt: { $gte: today },
      },
      {
        userId: user._id,
        coupleId: user.couple_id,
        mood,
        emoji,
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Log Activity
    try {
      await Activity.create({
        coupleId: user.couple_id,
        actorId: user._id,
        actionType: "mood_updated",
        details: { mood, emoji },
      });
    } catch (_) {}

    // Real-time emit to partner
    try {
      const io = getIO();
      if (io && user.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("partner_mood_updated", {
          mood,
          emoji,
          actorName: user.name,
        });
      }
    } catch (_) {}

    res.json({
      success: true,
      mood: updatedMood.mood,
      emoji: updatedMood.emoji,
    });
  } catch (error) {
    console.error("Save mood error:", error);
    res.status(500).json({
      message: "Failed to save mood",
    });
  }
};

export const getPartnerMood = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user?.partner_id) {
      return res.json(null);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mood = await Mood.findOne({
      userId: user.partner_id,
      createdAt: {
        $gte: today,
      },
    });

    res.json(mood);
  } catch (error) {
    console.error("Get partner mood error:", error);
    res.status(500).json({
      message: "Failed to fetch mood",
    });
  }
};

export const getMyMood = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mood = await Mood.findOne({
      userId,
      createdAt: {
        $gte: today,
      },
    });

    res.json(mood);
  } catch (error) {
    console.error("Get my mood error:", error);
    res.status(500).json({
      message: "Failed to fetch mood",
    });
  }
};

export const getMoodHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const moods = await Mood.find({ userId })
      .sort({ createdAt: -1 })
      .limit(7);

    const history = moods.map(m => ({
      mood: m.emoji || m.mood,
      date: m.createdAt,
    }));

    res.json(history.reverse());
  } catch (error) {
    console.error("Get mood history error:", error);
    res.status(500).json({
      message: "Failed to fetch mood history",
    });
  }
};
