import { Router } from "express";
import { getCoupleProfile } from "../controllers/couple.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authenticate, getCoupleProfile);

export default router;
