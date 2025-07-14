import { Router } from 'express';
import * as onCallController from '../controllers/onCall.controller';

const router = Router();

router.get('/properties/:propertyId/on-call-schedules', onCallController.getOnCallSchedulesByPropertyId);
router.post('/on-call-schedules', onCallController.createOnCallSchedule);
router.put('/on-call-schedules/:id', onCallController.updateOnCallSchedule);
router.delete('/on-call-schedules/:id', onCallController.deleteOnCallSchedule);

router.post('/on-call-rotations', onCallController.createOnCallRotation);
router.put('/on-call-rotations/:id', onCallController.updateOnCallRotation);
router.delete('/on-call-rotations/:id', onCallController.deleteOnCallRotation);

export default router;
