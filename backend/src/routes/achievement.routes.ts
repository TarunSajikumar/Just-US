import { Router } from "express";
import { getAchievements } from "../controllers/achievement.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getAchievements);

export default router;
