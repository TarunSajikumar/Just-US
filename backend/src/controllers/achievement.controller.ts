import { Response } from "express";
import Achievement from "../models/Achievement";
import User from "../models/User";
import Couple from "../models/Couple";
import { unlockAchievement } from "../services/achievement.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const getAchievements = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.json({ achievements: [] });
    }

    const couple = await Couple.findById(user.couple_id);
    if (!couple) {
      return res.json({ achievements: [] });
    }

    // Calculate days together
    const start = new Date(couple.relationshipStartDate || couple.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const daysTogether = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Automatically check and unlock time milestones
    if (daysTogether >= 100) {
      await unlockAchievement(user.couple_id, "100_DAYS");
    }
    if (daysTogether >= 365) {
      await unlockAchievement(user.couple_id, "365_DAYS");
    }

    const achievements = await Achievement.find({ coupleId: user.couple_id }).sort({ unlockedAt: -1 });

    res.json({
      success: true,
      achievements,
      daysTogether,
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ message: "Failed to fetch achievements" });
  }
};
