import { Router } from "express";
import { getPolls, createPoll, votePoll } from "../controllers/poll.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getPolls);
router.post("/", authMiddleware, createPoll);
router.post("/:id/vote", authMiddleware, votePoll);

export default router;
