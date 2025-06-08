import { Router } from 'express';
import { photoAnalysisController } from '../controllers/photoAnalysis.controller';

const router = Router();

router.post('/analyze', photoAnalysisController.analyzeMaintenancePhoto);

export default router;
