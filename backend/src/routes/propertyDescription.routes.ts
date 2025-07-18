import { Router } from 'express';
import { generateDescription } from '../controllers/aiController';

const router = Router();

router.post('/:propertyId/generate-description', generateDescription);

export default router;
