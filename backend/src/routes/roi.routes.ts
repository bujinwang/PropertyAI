import { Router } from 'express';
import * as roiController from '../controllers/roi.controller';

const router = Router();

router.get('/:propertyId', roiController.getRoi);

export default router;
