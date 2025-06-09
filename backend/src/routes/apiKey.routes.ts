import { Router } from 'express';
import * as apiKeyController from '../controllers/apiKey.controller';

const router = Router();

router.post('/api-keys', apiKeyController.generateApiKey);
router.get('/users/:userId/api-keys', apiKeyController.getApiKeysByUserId);
router.delete('/api-keys/:id', apiKeyController.deleteApiKey);

export default router;
