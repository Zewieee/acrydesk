import { Router } from 'express';
import { chatWithAI } from '../controllers/ai.controller.ts';

const router = Router();

router.post('/chat', chatWithAI);

export default router;
