import { Router } from 'express';
import * as businessHoursController from '../controllers/businessHours.controller';

const router = Router();

router.get('/properties/:propertyId/business-hours', businessHoursController.getBusinessHoursByPropertyId);
router.post('/business-hours', businessHoursController.createBusinessHours);
router.put('/business-hours/:id', businessHoursController.updateBusinessHours);
router.delete('/business-hours/:id', businessHoursController.deleteBusinessHours);

export default router;
