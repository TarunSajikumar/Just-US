import { Response } from "express";
import User from "../models/User";
import TimelineEvent from "../models/TimelineEvent";

/**
 * GET /api/timeline/:coupleId
 * Returns all timeline events for a couple, sorted by date (newest first).
 */
export const getTimelineEvents = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId } = req.params;

  if (!coupleId) {
    return res.status(400).json({ message: "coupleId is required" });
  }

  try {
    // Verify user belongs to this couple
    const user = await User.findOne({ _id: userId, couple_id: coupleId });

    if (!user) {
      return res.status(403).json({ message: "Not authorized for this couple" });
    }

    const events = await TimelineEvent.find({ couple_id: coupleId }).sort({ date: -1 });

    return res.json({ events });
  } catch (error) {
    console.error("getTimelineEvents error:", error);
    return res.status(500).json({ message: "Failed to fetch timeline events" });
  }
};

/**
 * POST /api/timeline
 * Body: { coupleId, title, description, date, type }
 * Adds a new event to the couple's timeline.
 */
export const createTimelineEvent = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId, title, description, date, type } = req.body;

  if (!coupleId || !title || !date) {
    return res.status(400).json({ message: "coupleId, title, and date are required" });
  }

  try {
    // Verify user belongs to this couple
    const user = await User.findOne({ _id: userId, couple_id: coupleId });

    if (!user) {
      return res.status(403).json({ message: "Not authorized for this couple" });
    }

    const event = await TimelineEvent.create({
      couple_id: coupleId,
      created_by: userId,
      title,
      description,
      date: new Date(date),
      type: type || "custom",
    });

    return res.status(201).json({ event });
  } catch (error) {
    console.error("createTimelineEvent error:", error);
    return res.status(500).json({ message: "Failed to create timeline event" });
  }
};

/**
 * DELETE /api/timeline/:eventId
 */
export const deleteTimelineEvent = async (req: any, res: Response) => {
  const userId = req.userId;
  const { eventId } = req.params;

  try {
    const event = await TimelineEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Verify user belongs to the couple of this event
    const user = await User.findOne({ _id: userId, couple_id: event.couple_id });
    if (!user) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await TimelineEvent.findByIdAndDelete(eventId);
    return res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("deleteTimelineEvent error:", error);
    return res.status(500).json({ message: "Failed to delete event" });
  }
};
