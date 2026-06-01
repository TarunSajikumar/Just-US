import { Response } from "express";
import User from "../models/User";
import Couple from "../models/Couple";

export const getCoupleProfile = async (req: any, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.relationship_status !== "couple" || !user.couple_id) {
      return res.status(400).json({
        message: "User is not in a couple",
        relationship_status: user.relationship_status
      });
    }

    const [partner, couple] = await Promise.all([
      User.findById(user.partner_id),
      Couple.findById(user.couple_id)
    ]);

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
      couple_id: user.couple_id,
      relationshipStartDate: couple?.relationshipStartDate || couple?.createdAt,
      anniversaryDate: couple?.anniversaryDate || null,
      nextMeetDate: couple?.nextMeetDate || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch couple profile" });
  }
};

export const updateRelationshipDate = async (req: any, res: Response) => {
  const { relationshipStartDate, anniversaryDate, nextMeetDate } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user?.couple_id) {
      return res.status(400).json({
        message: "Not connected to a couple",
      });
    }

    const couple = await Couple.findByIdAndUpdate(
      user.couple_id,
      {
        relationshipStartDate,
        anniversaryDate: anniversaryDate || null,
        nextMeetDate: nextMeetDate || null,
      },
      {
        new: true,
      }
    );

    res.json(couple);
  } catch (error) {
    res.status(500).json({ message: "Failed to update relationship date" });
  }
};
