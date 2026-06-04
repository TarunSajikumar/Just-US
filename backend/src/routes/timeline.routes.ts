import express from "express";
import {
  getTimelineEvents,
  createTimelineEvent,
  deleteTimelineEvent
} from "../controllers/timeline.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/:coupleId", getTimelineEvents);
router.post("/", createTimelineEvent);
router.delete("/:eventId", deleteTimelineEvent);

export default router;
