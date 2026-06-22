import express from "express";
import {
  trackPeriod,
  getPeriodTracker,
  getPartnerPeriodInfo,
  addPeriodHistory,
  updatePeriodReminders,
  updatePeriodPrivacy,
} from "../controllers/period.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post("/track", trackPeriod);
router.get("/tracker", getPeriodTracker);
router.get("/partner", getPartnerPeriodInfo);
router.post("/history", addPeriodHistory);
router.put("/reminders", updatePeriodReminders);
router.put("/privacy", updatePeriodPrivacy);

export default router;
