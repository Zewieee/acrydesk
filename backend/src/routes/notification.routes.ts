import { Router } from 'express';
import { getNotifications, markAsRead, createAnnouncement } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/read', markAsRead);

// Chỉ staff mới được tạo thông báo
router.post('/announcement', (req: any, res, next) => {
  if (['sales', 'manager', 'engineer'].includes(req.userRole)) {
    next();
  } else {
    res.status(403).json({ message: 'Không có quyền thực hiện hành động này' });
  }
}, createAnnouncement);

export default router;
