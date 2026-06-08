import { Response } from "express";
import Activity from "../models/Activity";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/activities
export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.couple_id) return res.json([]);

    const activities = await Activity.find({ coupleId: user.couple_id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("actorId", "name");

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch activity feed" });
  }
};
