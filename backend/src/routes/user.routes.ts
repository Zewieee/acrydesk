import { Router } from 'express';
import { getStaffAll, getAllUsers, updateStaffStatus, updateMyProfile } from '../controllers/user.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Staff management (Manager only)
router.get('/staff', authMiddleware, roleMiddleware(['manager']), getStaffAll);
router.get('/', authMiddleware, roleMiddleware(['manager']), getAllUsers);
router.put('/:id/status', authMiddleware, roleMiddleware(['manager']), updateStaffStatus);

// Personal Profile Update (Any logged in user)
router.put('/me', authMiddleware, updateMyProfile);

export default router;
