import { Router } from 'express';
import * as whiteLabelController from '../controllers/whiteLabel.controller';

const router = Router();

router.get('/properties/:propertyId/white-label-config', whiteLabelController.getWhiteLabelConfigByPropertyId);
router.post('/white-label-config', whiteLabelController.createWhiteLabelConfig);
router.put('/white-label-config/:id', whiteLabelController.updateWhiteLabelConfig);
router.delete('/white-label-config/:id', whiteLabelController.deleteWhiteLabelConfig);

export default router;
