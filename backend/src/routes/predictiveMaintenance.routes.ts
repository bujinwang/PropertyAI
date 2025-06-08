import { Router } from 'express';
import { predictiveMaintenanceController } from '../controllers/predictiveMaintenance.controller';

const router = Router();

router.get('/prediction/:unitId', predictiveMaintenanceController.getPrediction);

export default router;
