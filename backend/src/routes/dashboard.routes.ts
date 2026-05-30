import { Router, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import User from "../models/User";
import Message from "../models/Message";

const router = Router();

/**
 * GET /api/dashboard
 * Returns the logged-in user's profile, their partner (if linked),
 * the last 10 messages, and unread count.
 */
router.get("/", authMiddleware, async (req: any, res: Response) => {
  const userId: string = req.userId;

  try {
    // 1. Fetch current user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Fetch partner (if linked)
    let partner = null;
    if (user.partner_id) {
      partner = await User.findById(user.partner_id).select("id name email phone");
    }

    // 3. Fetch last 10 messages (both directions)
    let recentMessages: any[] = [];
    let unreadCount = 0;

    if (user.partner_id) {
      const messages = await Message.find({
        $or: [
          { sender_id: userId, receiver_id: user.partner_id },
          { sender_id: user.partner_id, receiver_id: userId },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10);

      recentMessages = messages.reverse(); // oldest first for display

      // 4. Unread count — messages FROM partner that I haven't read
      unreadCount = await Message.countDocuments({
        sender_id: user.partner_id,
        receiver_id: userId,
        read: false,
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: (user as any).createdAt,
      },
      partner,
      recentMessages,
      unreadCount,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
