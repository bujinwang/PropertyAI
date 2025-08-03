import { Router } from 'express';
import * as businessHoursController from '../controllers/businessHours.controller';

const router = Router();

router.get('/rentals/:rentalId/business-hours', businessHoursController.getBusinessHoursByRentalId); // Updated route and function name
router.post('/business-hours', businessHoursController.createBusinessHours);
router.put('/business-hours/:id', businessHoursController.updateBusinessHours);
router.delete('/business-hours/:id', businessHoursController.deleteBusinessHours);

export default router;
