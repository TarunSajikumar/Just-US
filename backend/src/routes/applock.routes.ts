import express from "express";
import {
  setupAppLock,
  verifyAppLock,
  getAppLockSettings,
  changePin,
  toggleAppLock,
  removeAppLock,
} from "../controllers/applock.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post("/setup", setupAppLock);
router.post("/verify", verifyAppLock);
router.get("/settings", getAppLockSettings);
router.put("/change-pin", changePin);
router.put("/toggle", toggleAppLock);
router.delete("/remove", removeAppLock);

export default router;
