import { Router } from 'express';
import { generateInviteCode, joinPartner } from '../controllers/inviteController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/generate', authMiddleware, generateInviteCode);
router.post('/join', authMiddleware, joinPartner);

export default router;
