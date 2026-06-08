import { Router } from "express";
import { getActivities } from "../controllers/activity.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getActivities);

export default router;
