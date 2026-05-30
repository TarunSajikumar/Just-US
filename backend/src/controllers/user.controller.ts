import { Response } from "express";
import User from "../models/User";

export const updatePartnerNickname = async (req: any, res: Response) => {
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
