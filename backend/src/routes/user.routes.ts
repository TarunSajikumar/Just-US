import { Router } from "express";
import {
  updatePartnerNickname,
  updatePingMessage,
  updateFcmToken,
  updateNotificationSettings,
  getPartnerStatus,
  getPreferences,
  updatePreferences,
  exportUserData,
  resetRelationshipStatus,
  getQuickLoveDefaultMessage,
  saveQuickLoveDefaultMessage,
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/partner-status", authMiddleware, getPartnerStatus);
router.put("/partner-nickname", authMiddleware, updatePartnerNickname);
router.put("/ping-message", authMiddleware, updatePingMessage);
router.put("/fcm-token", authMiddleware, updateFcmToken);
router.put("/notifications", authMiddleware, updateNotificationSettings);
router.get("/preferences", authMiddleware, getPreferences);
router.put("/preferences", authMiddleware, updatePreferences);
router.get("/export", authMiddleware, exportUserData);
router.post("/reset-status", authMiddleware, resetRelationshipStatus);
router.get("/settings/quick-love-default", authMiddleware, getQuickLoveDefaultMessage);
router.post("/settings/quick-love-default", authMiddleware, saveQuickLoveDefaultMessage);

export default router;
