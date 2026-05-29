import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Mock endpoint for message history
router.get('/messages/:partnerId', authMiddleware, (req, res) => {
  res.json([]);
});

export default router;
