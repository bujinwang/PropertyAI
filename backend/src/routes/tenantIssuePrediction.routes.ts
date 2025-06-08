import { Router } from 'express';
import { tenantIssuePredictionController } from '../controllers/tenantIssuePrediction.controller';

const router = Router();

router.post('/predict/:tenantId', tenantIssuePredictionController.predictIssues);

export default router;
