import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendPushNotification } from "../services/firebase.service";

export const sendMissYouPing = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { customMessage } = req.body; // Optional quick ping message

  try {
    const user = await User.findById(userId);
    if (!user || !user.partner_id) {
      return res.status(400).json({ message: "Partner not found" });
    }

    const partner = await User.findById(user.partner_id);
    if (!partner || !partner.fcmToken) {
      return res.status(404).json({ message: "Partner is offline or hasn't enabled notifications" });
    }

    if (!partner.notificationsEnabled) {
      return res.status(403).json({ message: "Partner has disabled notifications" });
    }

    const title = `❤️ ${user.name} misses you`;
    const body = customMessage || user.partnerPingMessage || "I miss you, where are you? ❤️";

    await sendPushNotification(partner.fcmToken, title, body, {
      type: 'MISS_YOU_PING',
      senderId: userId,
    });

    res.status(200).json({ success: true, message: "Miss You notification sent ❤️" });
  } catch (error) {
    console.error("Send Miss You Ping Error:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
};
