import { Request, Response } from "express";
import mongoose from "mongoose";
import PeriodTracker from "../models/PeriodTracker";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO } from "../sockets";

/**
 * Helper: Calculate period cycle dates
 */
const calculatePeriodDates = (lastPeriodDate: Date, cycleLengthDays: number, periodDurationDays: number) => {
  const last = new Date(lastPeriodDate);
  const next = new Date(last);
  next.setDate(next.getDate() + cycleLengthDays);

  // Ovulation typically occurs 14 days before next period
  const ovulationDay = new Date(next);
  ovulationDay.setDate(ovulationDay.getDate() - 14);

  // Fertile window: 5 days before ovulation to 1 day after
  const fertileWindowStart = new Date(ovulationDay);
  fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
  const fertileWindowEnd = new Date(ovulationDay);
  fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

  // PMS typically starts 5-11 days before period (use 7 days for this)
  const pmsStart = new Date(next);
  pmsStart.setDate(pmsStart.getDate() - 7);

  return {
    nextPeriodDate: next,
    ovulationDay,
    fertileWindowStart,
    fertileWindowEnd,
    pmsStart,
    pmsEnd: next,
  };
};

/**
 * POST /api/period/track
 * Create or update period tracking entry
 */
export const trackPeriod = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { lastPeriodDate, cycleLengthDays, periodDurationDays, isPrivate } = req.body;

  if (!lastPeriodDate || !cycleLengthDays || !periodDurationDays) {
    return res.status(400).json({ message: "lastPeriodDate, cycleLengthDays, and periodDurationDays are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "User must be in a couple to track period" });
    }

    const tracker = await PeriodTracker.findOneAndUpdate(
      { userId, coupleId: user.couple_id },
      {
        userId,
        coupleId: user.couple_id,
        lastPeriodDate: new Date(lastPeriodDate),
        cycleLengthDays: Math.max(21, Math.min(35, cycleLengthDays)),
        periodDurationDays: Math.max(2, Math.min(7, periodDurationDays)),
        isPrivate: isPrivate !== false,
      },
      { upsert: true, new: true }
    );

    const dates = calculatePeriodDates(tracker.lastPeriodDate, tracker.cycleLengthDays, tracker.periodDurationDays);

    // Notify partner via socket if not private
    if (!tracker.isPrivate) {
      const io = getIO();
      if (io && user.partner_id) {
        io.to(user.partner_id.toString()).emit("period_tracker_updated", {
          userId,
          dates,
          message: "Your partner updated their period tracker",
        });
      }
    }

    return res.status(200).json({
      success: true,
      tracker,
      dates,
    });
  } catch (error) {
    console.error("trackPeriod error:", error);
    return res.status(500).json({ message: "Failed to track period" });
  }
};

/**
 * GET /api/period/tracker
 * Get current period tracking info for authenticated user
 */
export const getPeriodTracker = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "User not in a couple" });
    }

    const tracker = await PeriodTracker.findOne({ userId, coupleId: user.couple_id });
    if (!tracker) {
      return res.status(404).json({ message: "Period tracker not set up" });
    }

    const dates = calculatePeriodDates(tracker.lastPeriodDate, tracker.cycleLengthDays, tracker.periodDurationDays);

    return res.json({ tracker, dates });
  } catch (error) {
    console.error("getPeriodTracker error:", error);
    return res.status(500).json({ message: "Failed to fetch period tracker" });
  }
};

/**
 * GET /api/period/partner
 * Get partner's period info (only if shared)
 */
export const getPartnerPeriodInfo = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const user = await User.findById(userId).populate("partner_id");
    if (!user || !user.partner_id || !user.couple_id) {
      return res.status(400).json({ message: "No partner in couple" });
    }

    const partnerTracker = await PeriodTracker.findOne({
      userId: user.partner_id,
      coupleId: user.couple_id,
      isPrivate: false,
    });

    if (!partnerTracker) {
      return res.status(404).json({ message: "Partner has not shared period information" });
    }

    const dates = calculatePeriodDates(
      partnerTracker.lastPeriodDate,
      partnerTracker.cycleLengthDays,
      partnerTracker.periodDurationDays
    );

    return res.json({
      partner: {
        id: user.partner_id._id,
        name: user.partner_id.name,
      },
      dates,
      reminders: partnerTracker.reminders,
    });
  } catch (error) {
    console.error("getPartnerPeriodInfo error:", error);
    return res.status(500).json({ message: "Failed to fetch partner period info" });
  }
};

/**
 * POST /api/period/history
 * Add historical period entry
 */
export const addPeriodHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { startDate, endDate, flow, symptoms, notes } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "startDate and endDate are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "User not in a couple" });
    }

    const tracker = await PeriodTracker.findOne({ userId, coupleId: user.couple_id });
    if (!tracker) {
      return res.status(404).json({ message: "Period tracker not found" });
    }

    const historyEntry = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      flow: flow || "normal",
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      notes: notes || "",
      createdAt: new Date(),
    };

    tracker.history.push(historyEntry as any);
    await tracker.save();

    return res.status(201).json({ success: true, historyEntry });
  } catch (error) {
    console.error("addPeriodHistory error:", error);
    return res.status(500).json({ message: "Failed to add period history" });
  }
};

/**
 * PUT /api/period/reminders
 * Update period reminder preferences
 */
export const updatePeriodReminders = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { periodStarting, ovulationDay, pmsReminder } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "User not in a couple" });
    }

    const tracker = await PeriodTracker.findOneAndUpdate(
      { userId, coupleId: user.couple_id },
      {
        reminders: {
          periodStarting: periodStarting !== false,
          ovulationDay: ovulationDay !== false,
          pmsReminder: pmsReminder !== false,
        },
      },
      { new: true }
    );

    if (!tracker) {
      return res.status(404).json({ message: "Period tracker not found" });
    }

    return res.json({ success: true, reminders: tracker.reminders });
  } catch (error) {
    console.error("updatePeriodReminders error:", error);
    return res.status(500).json({ message: "Failed to update reminders" });
  }
};

/**
 * PUT /api/period/privacy
 * Update privacy setting for period tracker
 */
export const updatePeriodPrivacy = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { isPrivate } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || !user.couple_id) {
      return res.status(400).json({ message: "User not in a couple" });
    }

    const tracker = await PeriodTracker.findOneAndUpdate(
      { userId, coupleId: user.couple_id },
      { isPrivate: isPrivate !== false },
      { new: true }
    );

    if (!tracker) {
      return res.status(404).json({ message: "Period tracker not found" });
    }

    return res.json({ success: true, isPrivate: tracker.isPrivate });
  } catch (error) {
    console.error("updatePeriodPrivacy error:", error);
    return res.status(500).json({ message: "Failed to update privacy" });
  }
};
