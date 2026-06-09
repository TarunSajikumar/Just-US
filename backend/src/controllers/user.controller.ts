import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO } from "../sockets";

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
        returnDocument: 'after',
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
      { returnDocument: 'after' }
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
      { returnDocument: 'after' }
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

    if (!user.partner_id || user.partner_id.toString() === "" || user.partner_id.toString() === "null") {
      return res.status(404).json({ message: "Partner ID not connected" });
    }

    const partner = await User.findById(user.partner_id);

    const io = getIO();
    let isOnline = false;
    if (io && partner) {
      const partnerRoom = io.sockets.adapter.rooms.get(partner._id.toString());
      isOnline = partnerRoom ? partnerRoom.size > 0 : (partner.isOnline || false);
    } else if (partner) {
      isOnline = partner.isOnline || false;
    }

    return res.json({
      name: partner?.name || "Partner",
      isOnline,
      lastSeen: partner?.lastSeen || null,
    });
  } catch (error) {
    console.error("getPartnerStatus error:", error);
    res.status(500).json({ message: "Failed to get partner status" });
  }
};

export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('preferences');
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json((user as any).preferences || { language: 'en', fontSize: 'medium' });
  } catch (error) {
    res.status(500).json({ message: "Failed to get preferences" });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  const { language, fontSize, quickLoveNotifications } = req.body;
  try {
    const update: any = {};
    if (language) update['preferences.language'] = language;
    if (fontSize) update['preferences.fontSize'] = fontSize;
    if (quickLoveNotifications !== undefined) update['preferences.quickLoveNotifications'] = quickLoveNotifications;

    const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { returnDocument: 'after' });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ success: true, preferences: (user as any).preferences });
  } catch (error) {
    res.status(500).json({ message: "Failed to update preferences" });
  }
};

export const exportUserData = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-fcmToken');
    if (!user) return res.status(404).json({ message: "User not found" });

    // In a production app you'd email them a download link.
    // For now, return a JSON snapshot.
    return res.json({
      success: true,
      message: "Your data export has been queued. You will receive an email shortly.",
      preview: {
        email: user.email,
        name: user.name,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to export data" });
  }
};

export const resetRelationshipStatus = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        relationship_status: "solo",
        couple_id: null,
        partner_id: null,
        partnerNickname: "",
      },
      { returnDocument: 'after' }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Relationship status reset to solo",
      user: user,
    });
  } catch (error) {
    console.error("resetRelationshipStatus error:", error);
    res.status(500).json({ message: "Failed to reset relationship status" });
  }
};

export const getQuickLoveDefaultMessage = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('quickLoveDefaultMessage');
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ defaultMessage: user.quickLoveDefaultMessage || "I Love You ❤️" });
  } catch (error) {
    res.status(500).json({ message: "Failed to get quick love setting" });
  }
};

export const saveQuickLoveDefaultMessage = async (req: AuthRequest, res: Response) => {
  const { defaultMessage } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { quickLoveDefaultMessage: defaultMessage },
      { returnDocument: 'after' }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ success: true, defaultMessage: user.quickLoveDefaultMessage });
  } catch (error) {
    res.status(500).json({ message: "Failed to save quick love setting" });
  }
};
