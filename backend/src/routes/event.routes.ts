import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getEvents, createEvent, deleteEvent } from "../controllers/event.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getEvents);
router.post("/", createEvent);
router.delete("/:id", deleteEvent);

export default router;
