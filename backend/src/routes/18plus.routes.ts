import express from "express";
import {
  requestEighteenPlusMode,
  acceptEighteenPlusMode,
  rejectEighteenPlusMode,
  revokeEighteenPlusMode,
  getEighteenPlusStatus,
} from "../controllers/18plus.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post("/request", requestEighteenPlusMode);
router.post("/accept", acceptEighteenPlusMode);
router.post("/reject", rejectEighteenPlusMode);
router.post("/revoke", revokeEighteenPlusMode);
router.get("/status", getEighteenPlusStatus);

export default router;
