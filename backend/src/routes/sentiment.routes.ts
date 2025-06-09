import { Router } from 'express';
import * as sentimentController from '../controllers/sentiment.controller';

const router = Router();

router.post('/sentiment/analyze', sentimentController.analyzeSentiment);

export default router;
