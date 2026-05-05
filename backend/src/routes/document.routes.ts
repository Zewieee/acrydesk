import { Router } from 'express';
import { getAllCustomerDocuments } from '../controllers/document.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', roleMiddleware(['customer']), getAllCustomerDocuments);

export default router;
