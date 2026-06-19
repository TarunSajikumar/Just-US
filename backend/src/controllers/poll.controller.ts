import { Response } from "express";
import Poll from "../models/Poll";
import User from "../models/User";
import Activity from "../models/Activity";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO, getCoupleRoomId } from "../sockets";

// Helper: log activity
async function logActivity(coupleId: any, actorId: any, actionType: any, details: object) {
  try {
    await Activity.create({ coupleId, actorId, actionType, details });
  } catch (_) {}
}

// GET /api/polls
export const getPolls = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.couple_id) return res.json([]);

    const polls = await Poll.find({
      coupleId: user.couple_id,
      endsAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch polls" });
  }
};

// POST /api/polls
export const createPoll = async (req: AuthRequest, res: Response) => {
  try {
    const { question, options, durationHours = 24 } = req.body;
    const user = await User.findById(req.userId);

    if (!user?.couple_id) return res.status(400).json({ message: "Not in a couple" });
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Question and at least 2 options required" });
    }

    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + durationHours);

    const poll = await Poll.create({
      coupleId: user.couple_id,
      createdBy: user._id,
      question: question.trim(),
      options: options.map(o => o.trim()),
      endsAt,
      votes: {}
    });

    await logActivity(user.couple_id, user._id, "poll_created", { question });

    // Real-time push
    try {
      const io = getIO();
      if (io && user.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("poll_created", {
          poll,
          actorName: user.name,
        });
      }
    } catch (_) {}

    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ message: "Failed to create poll" });
  }
};

// POST /api/polls/:id/vote
export const votePoll = async (req: AuthRequest, res: Response) => {
  try {
    const { optionIndex } = req.body;
    const user = await User.findById(req.userId);
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.endsAt < new Date()) return res.status(400).json({ message: "Poll has expired" });
    if (String(poll.coupleId) !== String(user?.couple_id)) return res.status(403).json({ message: "Not your poll" });

    // Update or add vote
    const votes = { ...poll.votes };
    votes[req.userId!] = optionIndex;
    poll.votes = votes;
    poll.markModified('votes');
    await poll.save();

    await logActivity(user!.couple_id, user!._id, "poll_voted", {
      question: poll.question,
      option: poll.options[optionIndex]
    });

    // Real-time push
    try {
      const io = getIO();
      if (io && user?.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("poll_voted", {
          pollId: poll._id,
          actorName: user.name,
        });
      }
    } catch (_) {}

    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: "Failed to vote" });
  }
};

// DELETE /api/polls/:id
export const deletePoll = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (String(poll.coupleId) !== String(user?.couple_id))
      return res.status(403).json({ message: "Not your poll" });

    await poll.deleteOne();

    // Real-time sync
    try {
      const io = getIO();
      if (io && user?.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("poll_deleted", {
          pollId: req.params.id,
          actorName: user.name,
        });
      }
    } catch (_) {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete poll" });
  }
};
