import { Router } from 'express';
import * as tenantIssuePredictionController from '../controllers/tenantIssuePrediction.controller';

const router = Router();

router.get('/', tenantIssuePredictionController.getTenantIssuePredictions);
router.get('/:id', tenantIssuePredictionController.getTenantIssuePredictionById);
router.post('/predict/:tenantId', tenantIssuePredictionController.predictTenantIssues);

export default router;
