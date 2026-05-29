import { Router } from 'express';
import { getMessages, createMessage } from '../controllers/messages.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/:coupleId', authMiddleware, getMessages);
router.post('/', authMiddleware, createMessage);

export default router;
