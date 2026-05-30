import { Response } from "express";
import User from "../models/User";

export const getCoupleProfile = async (req: any, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.relationship_status !== "couple" || !user.partner_id) {
      return res.status(400).json({
        message: "User is not in a couple",
        relationship_status: user.relationship_status
      });
    }

    const partner = await User.findById(user.partner_id);

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.json({
      partner: {
        name: partner.name,
        email: partner.email,
        birthday: partner.birthday,
        gender: partner.gender
      },
      relationship_status: user.relationship_status,
      couple_id: user.couple_id
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch couple profile" });
  }
};
