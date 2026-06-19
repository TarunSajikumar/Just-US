import { Router } from "express";
import {
  getCoupleProfile,
  updateRelationshipDate,
  getQuickLoveMessages,
  addQuickLoveMessage,
  getCoupleSettings,
  requestFeature,
  acceptFeature,
  declineFeature,
  disableFeature,
  getConnectionLevel,
  updateConnectionLevel,
  getQuestions,
  sendQuestion,
  answerQuestion,
  getWishlist,
  addWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  getPositions,
  updatePositionStatus,
  getIdeas,
  toggleIdeaLike,
  toggleIdeaComplete,
  getChallenges,
  toggleChallengeComplete,
  deleteQuickLoveMessage
} from "../controllers/couple.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/profile", authMiddleware, getCoupleProfile);
router.put("/relationship-date", authMiddleware, updateRelationshipDate);
router.get("/quick-love-messages", authMiddleware, getQuickLoveMessages);
router.post("/quick-love-messages", authMiddleware, addQuickLoveMessage);
router.delete("/quick-love-messages/:id", authMiddleware, deleteQuickLoveMessage);

// Couple+ Settings
router.get("/settings", authMiddleware, getCoupleSettings);
router.post("/request-feature", authMiddleware, requestFeature);
router.post("/accept-feature", authMiddleware, acceptFeature);
router.post("/decline-feature", authMiddleware, declineFeature);
router.post("/disable-feature", authMiddleware, disableFeature);

// Connection Level
router.get("/connection-level", authMiddleware, getConnectionLevel);
router.post("/connection-level", authMiddleware, updateConnectionLevel);

// Couple Questions
router.get("/questions", authMiddleware, getQuestions);
router.post("/questions/send", authMiddleware, sendQuestion);
router.post("/questions/answer", authMiddleware, answerQuestion);

// Private Wishlist
router.get("/wishlist", authMiddleware, getWishlist);
router.post("/wishlist", authMiddleware, addWishlistItem);
router.put("/wishlist/:id", authMiddleware, updateWishlistItem);
router.delete("/wishlist/:id", authMiddleware, deleteWishlistItem);

// Position Explorer
router.get("/positions", authMiddleware, getPositions);
router.post("/positions/:positionId/status", authMiddleware, updatePositionStatus);

// Romantic Ideas
router.get("/ideas", authMiddleware, getIdeas);
router.post("/ideas/:ideaId/like", authMiddleware, toggleIdeaLike);
router.post("/ideas/:ideaId/complete", authMiddleware, toggleIdeaComplete);

// Couple Challenges
router.get("/challenges", authMiddleware, getChallenges);
router.post("/challenges/:challengeId/complete", authMiddleware, toggleChallengeComplete);

export default router;
