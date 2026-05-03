import { Router } from 'express';
import { 
  createAnnouncement, 
  getAnnouncements, 
  updateAnnouncement, 
  deleteAnnouncement 
} from '../controllers/announcement.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getAnnouncements);
router.post('/', authMiddleware, roleMiddleware(['manager', 'sales']), createAnnouncement);
router.put('/:id', authMiddleware, roleMiddleware(['manager', 'sales']), updateAnnouncement);
router.delete('/:id', authMiddleware, roleMiddleware(['manager', 'sales']), deleteAnnouncement);

export default router;
