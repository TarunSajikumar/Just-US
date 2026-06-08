import { Router } from "express";
import { saveNote, getPartnerNote, getAllNotes } from "../controllers/note.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, saveNote);
router.get("/partner", authMiddleware, getPartnerNote);
router.get("/", authMiddleware, getAllNotes);

export default router;
