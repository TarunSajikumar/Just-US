import { Router } from 'express';
import {
  getMessages,
  createMessage,
  markMessagesRead,
  deleteMessage,
  searchMessages,
  addReaction,
  uploadMediaMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  saveMessage,
  unsaveMessage,
  getSavedMessages,
  editMessage,
  deleteMessageForMe,
  forwardMessage,
  getUnreadCount,
} from '../controllers/messages.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// NOTE: /search and other static-first subroutes must be declared before parameters to avoid conflicts
router.get('/search', authMiddleware, searchMessages);
router.get('/pinned/:partnerId', authMiddleware, getPinnedMessages);
router.get('/saved/:partnerId', authMiddleware, getSavedMessages);
router.get('/unread/:partnerId', authMiddleware, getUnreadCount);

router.get('/:partnerId', authMiddleware, getMessages);
router.post('/', authMiddleware, createMessage);
router.patch('/:partnerId/read', authMiddleware, markMessagesRead);
router.delete('/:messageId', authMiddleware, deleteMessage);
router.post('/:messageId/reaction', authMiddleware, addReaction);
router.post('/media', authMiddleware, upload.single('file'), uploadMediaMessage);

// Pinned / Saved / Editing / Forwarding / Delete for me routes
router.post('/pin/:messageId', authMiddleware, pinMessage);
router.delete('/pin/:messageId', authMiddleware, unpinMessage);
router.post('/save/:messageId', authMiddleware, saveMessage);
router.delete('/save/:messageId', authMiddleware, unsaveMessage);
router.put('/:messageId', authMiddleware, editMessage);
router.post('/:messageId/delete-for-me', authMiddleware, deleteMessageForMe);
router.post('/:messageId/forward', authMiddleware, forwardMessage);

export default router;
