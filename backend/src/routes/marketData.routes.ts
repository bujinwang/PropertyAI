import { Router } from 'express';
import { marketDataController } from '../controllers/marketData.controller';

const router = Router();

router.get('/comps/:propertyId', marketDataController.getComps);

export default router;