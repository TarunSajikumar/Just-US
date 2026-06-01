import { Router } from "express";
import { getCoupleProfile, updateRelationshipDate } from "../controllers/couple.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/profile", authMiddleware, getCoupleProfile);
router.put("/relationship-date", authMiddleware, updateRelationshipDate);

export default router;
