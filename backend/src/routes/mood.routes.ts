import { Router } from "express";
import { saveMood, getPartnerMood } from "../controllers/mood.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, saveMood);
router.get("/partner", authMiddleware, getPartnerMood);

export default router;
