import express from "express";
import {
  addHeart,
  removeHeart,
  getMessageHearts,
  getHeartCount,
} from "../controllers/hearts.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post("/add", addHeart);
router.delete("/:messageId", removeHeart);
router.get("/:messageId", getMessageHearts);
router.get("/count/:messageId", getHeartCount);

export default router;
