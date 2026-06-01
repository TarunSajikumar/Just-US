import { Router } from "express";
import { saveNote, getPartnerNote } from "../controllers/note.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, saveNote);
router.get("/partner", authMiddleware, getPartnerNote);

export default router;
