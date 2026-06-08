import { Router } from "express";
import { getGoals, createGoal, updateGoalProgress, deleteGoal } from "../controllers/goal.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getGoals);
router.post("/", authMiddleware, createGoal);
router.patch("/:id/progress", authMiddleware, updateGoalProgress);
router.delete("/:id", authMiddleware, deleteGoal);

export default router;
