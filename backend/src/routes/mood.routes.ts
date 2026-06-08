import { Router } from "express";
import { saveMood, getPartnerMood, getMyMood, getMoodHistory } from "../controllers/mood.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, saveMood);
router.get("/partner", authMiddleware, getPartnerMood);
router.get("/me", authMiddleware, getMyMood);
router.get("/history", authMiddleware, getMoodHistory);

export default router;
