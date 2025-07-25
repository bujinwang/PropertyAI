import { Router } from 'express';
import { complianceController } from '../controllers/compliance.controller';

const router = Router();

router.get('/data-access/:userId', complianceController.getDataAccessRequest);
router.get('/data-portability/:userId', complianceController.getDataPortabilityRequest);
router.delete('/data-erasure/:userId', complianceController.getDataErasureRequest);

export default router;