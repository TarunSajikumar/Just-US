import { Router } from 'express';
import { createInvite, joinInvite } from '../controllers/inviteController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/create', authMiddleware, createInvite);
router.post('/join', authMiddleware, joinInvite);

export default router;
