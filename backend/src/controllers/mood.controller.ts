import { Response } from "express";
import Mood from "../models/Mood";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

export const saveMood = async (req: AuthRequest, res: Response) => {
  try {
    const { mood } = req.body;
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
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json({
      success: true,
      mood: updatedMood.mood,
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
