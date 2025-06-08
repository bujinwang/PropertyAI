import { Router } from 'express';
import { riskAssessmentController } from '../controllers/riskAssessment.controller';

const router = Router();

router.post('/assess/:applicationId', riskAssessmentController.assessRisk);

export default router;
