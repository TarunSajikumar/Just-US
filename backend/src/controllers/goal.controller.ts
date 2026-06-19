import { Response } from "express";
import Goal from "../models/Goal";
import User from "../models/User";
import Activity from "../models/Activity";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO, getCoupleRoomId } from "../sockets";

// Helper: log activity
async function logActivity(
  coupleId: any,
  actorId: any,
  actionType: any,
  details: object
) {
  try {
    await Activity.create({ coupleId, actorId, actionType, details });
  } catch (_) {}
}

// GET /api/goals
export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.couple_id) return res.json([]);

    const goals = await Goal.find({ coupleId: user.couple_id }).sort({
      completed: 1,
      createdAt: -1,
    });

    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch goals" });
  }
};

// POST /api/goals
export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { title, target, emoji } = req.body;
    const user = await User.findById(req.userId);

    if (!user?.couple_id)
      return res.status(400).json({ message: "Not in a couple" });
    if (!title || !target)
      return res.status(400).json({ message: "Title and target required" });

    const goal = await Goal.create({
      coupleId: user.couple_id,
      createdBy: user._id,
      title: title.trim(),
      emoji: emoji || "🎯",
      target: Math.max(1, parseInt(target)),
    });

    await logActivity(user.couple_id, user._id, "goal_created", {
      title,
      emoji: emoji || "🎯",
    });

    // Real-time push to partner
    try {
      const io = getIO();
      if (io && user.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("goal_created", {
          goal,
          actorName: user.name,
        });
      }
    } catch (_) {}

    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: "Failed to create goal" });
  }
};

// PATCH /api/goals/:id/progress
export const updateGoalProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { increment = 1 } = req.body;
    const user = await User.findById(req.userId);
    const goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (String(goal.coupleId) !== String(user?.couple_id))
      return res.status(403).json({ message: "Not your goal" });
    if (goal.completed) return res.json(goal);

    const prevCurrent = goal.current;
    const newCurrent = Math.min(goal.current + increment, goal.target);
    goal.current = newCurrent;

    if (newCurrent >= goal.target) {
      goal.completed = true;
      goal.completedAt = new Date();
      await logActivity(user!.couple_id, user!._id, "goal_completed", {
        title: goal.title,
      });
    } else {
      await logActivity(user!.couple_id, user!._id, "goal_updated", {
        title: goal.title,
        current: newCurrent,
        target: goal.target,
      });
    }

    await goal.save();

    // Real-time sync
    try {
      const io = getIO();
      if (io && user?.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        const event = goal.completed ? "goal_completed" : "goal_updated";
        io.to(room).emit(event, {
          goal,
          actorName: user.name,
        });

        // Milestone notifications at 50% and 75%
        if (!goal.completed) {
          const prevPct = (prevCurrent / goal.target) * 100;
          const newPct = (newCurrent / goal.target) * 100;
          if (prevPct < 50 && newPct >= 50) {
            io.to(room).emit("goal_milestone", {
              goal,
              milestone: 50,
              actorName: user.name,
            });
          } else if (prevPct < 75 && newPct >= 75) {
            io.to(room).emit("goal_milestone", {
              goal,
              milestone: 75,
              actorName: user.name,
            });
          }
        }
      }
    } catch (_) {}

    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: "Failed to update goal" });
  }
};

// DELETE /api/goals/:id
export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    const goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (String(goal.coupleId) !== String(user?.couple_id))
      return res.status(403).json({ message: "Not your goal" });

    await goal.deleteOne();

    // Real-time sync
    try {
      const io = getIO();
      if (io && user?.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("goal_deleted", {
          goalId: req.params.id,
          actorName: user.name,
        });
      }
    } catch (_) {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete goal" });
  }
};
