import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

export const updatePartnerNickname = async (req: AuthRequest, res: Response) => {
  const { nickname } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        partnerNickname: nickname?.trim() || "",
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      partnerNickname: user.partnerNickname,
    });
  } catch (error) {
    console.error("Update partner nickname error:", error);
    res.status(500).json({ message: "Failed to update partner nickname" });
  }
};

export const updatePingMessage = async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        partnerPingMessage: message?.trim() || "I miss you, where are you? ❤️",
      },
      { new: true }
    );

    return res.json({
      success: true,
      partnerPingMessage: user?.partnerPingMessage,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update ping message" });
  }
};

export const updateFcmToken = async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  const userId = req.userId;

  try {
    await User.findByIdAndUpdate(userId, { fcmToken: token });
    return res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to update FCM token" });
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  const { enabled } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationsEnabled: enabled },
      { new: true }
    );
    return res.json({
      success: true,
      notificationsEnabled: user?.notificationsEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification settings" });
  }
};

export const getPartnerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.partner_id) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const partner = await User.findById(user.partner_id);

    return res.json({
      name: partner?.name || "Partner",
      isOnline: partner?.isOnline || false,
      lastSeen: partner?.lastSeen || null,
    });
  } catch (error) {
    console.error("getPartnerStatus error:", error);
    res.status(500).json({ message: "Failed to get partner status" });
  }
};
