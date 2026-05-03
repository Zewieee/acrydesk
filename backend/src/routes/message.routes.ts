import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/message.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

// Get messages for a request
router.get('/:requestId', getMessages);

// Send message
router.post('/:requestId', sendMessage);

export default router;
