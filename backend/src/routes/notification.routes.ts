import { Router } from "express";
import { sendMissYouPing } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/miss-you", authMiddleware, sendMissYouPing);

export default router;
