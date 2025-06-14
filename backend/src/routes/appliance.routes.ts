import { Router } from 'express';
import * as applianceController from '../controllers/appliance.controller';

const router = Router();

router.get('/units/:unitId/appliances', applianceController.getAppliancesByUnitId);
router.post('/appliances', applianceController.createAppliance);
router.get('/appliances/:id', applianceController.getApplianceById);
router.put('/appliances/:id', applianceController.updateAppliance);
router.delete('/appliances/:id', applianceController.deleteAppliance);

export default router;
