import { Router } from 'express';
import { 
  register, 
  registerStaff, 
  login, 
  getMe, 
  changePassword, 
  refreshToken, 
  forgotPassword, 
  resetPassword,
  logout
} from '../controllers/auth.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.post('/change-password', authMiddleware, changePassword);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Only manager can create staff accounts
router.post('/register-staff', authMiddleware, roleMiddleware(['manager']), registerStaff);

export default router;