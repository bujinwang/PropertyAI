import { Router } from 'express';
import * as translationController from '../controllers/translation.controller';
import { billedEndpointLimiter } from '../middleware/billedEndpointGuards';

const router = Router();

// Translation is billed per character, so the endpoint is throttled. See
// `middleware/billedEndpointGuards` for the cost rationale and the length cap.
router.post('/translate', billedEndpointLimiter, translationController.translateText);

export default router;
