import { Router } from "express";
import {
  sendMissYouPing,
  sendIntimateQuestion,
  sendDateIdea,
  sendQuestionAnswer,
} from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/miss-you", authMiddleware, sendMissYouPing);
router.post("/intimate-question", authMiddleware, sendIntimateQuestion);
router.post("/date-idea", authMiddleware, sendDateIdea);
router.post("/question-answer", authMiddleware, sendQuestionAnswer);

export default router;
