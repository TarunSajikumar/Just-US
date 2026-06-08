import { Response } from "express";
import Event from "../models/Event";
import User from "../models/User";
import Activity from "../models/Activity";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO, getCoupleRoomId } from "../sockets";

async function logActivity(coupleId: any, actorId: any, actionType: any, details: object) {
  try {
    await Activity.create({ coupleId, actorId, actionType, details });
  } catch (_) {}
}

// GET /api/events — upcoming events for the couple
export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.couple_id) return res.json([]);

    const events = await Event.find({
      coupleId: user.couple_id,
      eventDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
      .sort({ eventDate: 1 })
      .limit(10);

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// POST /api/events
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, eventDate, eventType = "custom", emoji = "📅" } = req.body;
    const user = await User.findById(req.userId);

    if (!user?.couple_id) return res.status(400).json({ message: "Not in a couple" });
    if (!title || !eventDate) return res.status(400).json({ message: "Title and date required" });

    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const event = await Event.create({
      coupleId: user.couple_id,
      createdBy: user._id,
      title: title.trim(),
      eventDate: parsedDate,
      eventType,
      emoji,
    });

    await logActivity(user.couple_id, user._id, "event_created", { title, eventType, emoji });

    // Real-time push to partner
    try {
      const io = getIO();
      if (io && user.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("event_created", {
          event,
          actorName: user.name,
        });
      }
    } catch (_) {}

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: "Failed to create event" });
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.coupleId) !== String(user?.couple_id)) {
      return res.status(403).json({ message: "Not your event" });
    }

    await event.deleteOne();

    // Real-time push
    try {
      const io = getIO();
      if (io && user?.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("event_deleted", { eventId: req.params.id });
      }
    } catch (_) {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete event" });
  }
};
