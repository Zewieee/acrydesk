import { Router } from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  updateRequestStatus,
  assignRequest,
  deleteRequest,
  submitFeedback,
  updateProductionStage,
} from '../controllers/request.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getRequests);
router.get('/:id', getRequestById);
router.post('/', roleMiddleware(['customer', 'sales', 'manager']), createRequest);
router.put('/:id', roleMiddleware(['customer', 'sales', 'manager']), updateRequest);
router.patch('/:id/status', roleMiddleware(['sales', 'engineer', 'manager']), updateRequestStatus);
router.patch('/:id/assign', roleMiddleware(['manager']), assignRequest);
router.post('/:id/feedback', roleMiddleware(['customer']), submitFeedback);
router.delete('/:id', roleMiddleware(['customer', 'sales', 'manager']), deleteRequest);
router.patch('/:id/production-stage', roleMiddleware(['sales', 'engineer', 'manager']), updateProductionStage);

export default router;