import { Router } from "express";
import { updatePartnerNickname } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.put("/partner-nickname", authMiddleware, updatePartnerNickname);

export default router;
