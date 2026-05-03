import { Router } from 'express';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  sendQuotation,
  deleteQuotation,
  acceptQuotation,
  rejectQuotation,
} from '../controllers/quotation.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.post('/', roleMiddleware(['sales', 'manager']), createQuotation);
router.put('/:id', roleMiddleware(['sales', 'manager']), updateQuotation);
router.patch('/:id/send', roleMiddleware(['sales', 'manager']), sendQuotation);
router.delete('/:id', roleMiddleware(['sales', 'manager']), deleteQuotation);

// Customer accept / reject
router.patch('/:id/accept', roleMiddleware(['customer']), acceptQuotation);
router.patch('/:id/reject', roleMiddleware(['customer']), rejectQuotation);

export default router;
