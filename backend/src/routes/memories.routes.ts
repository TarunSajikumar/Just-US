import { Router } from 'express';
import { getMemories, createMemory } from '../controllers/memories.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/:coupleId', authMiddleware, getMemories);
router.post('/', authMiddleware, createMemory);

export default router;
