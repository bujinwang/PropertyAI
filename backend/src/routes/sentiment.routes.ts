import { Router } from 'express';
import * as sentimentController from '../controllers/sentiment.controller';
import { billedEndpointLimiter } from '../middleware/billedEndpointGuards';

const router = Router();

// Two billed vendors per request (translate + generate), so the endpoint is
// throttled on top of the length cap.
router.post('/sentiment/analyze', billedEndpointLimiter, sentimentController.analyzeSentiment);

export default router;
