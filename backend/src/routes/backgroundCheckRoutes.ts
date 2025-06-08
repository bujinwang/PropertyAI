import { Router } from 'express';
import BackgroundCheckController from '../controllers/backgroundCheckController';

const router = Router();

router.post('/candidates', BackgroundCheckController.createCandidate);
router.post('/reports', BackgroundCheckController.createReport);
router.get('/reports/:id', BackgroundCheckController.getReport);
router.post('/webhooks', BackgroundCheckController.handleWebhook);

export default router;
