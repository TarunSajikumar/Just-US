import { Router } from "express";
import {
  updatePartnerNickname,
  updatePingMessage,
  updateFcmToken,
  getPartnerStatus,
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/partner-status", authMiddleware, getPartnerStatus);
router.put("/partner-nickname", authMiddleware, updatePartnerNickname);
router.put("/ping-message", authMiddleware, updatePingMessage);
router.put("/fcm-token", authMiddleware, updateFcmToken);

export default router;
