import { Router } from 'express';
import * as emergencyProtocolController from '../controllers/emergencyProtocol.controller';

const router = Router();

router.get('/properties/:propertyId/emergency-protocols', emergencyProtocolController.getEmergencyProtocolsByPropertyId);
router.post('/emergency-protocols', emergencyProtocolController.createEmergencyProtocol);
router.put('/emergency-protocols/:id', emergencyProtocolController.updateEmergencyProtocol);
router.delete('/emergency-protocols/:id', emergencyProtocolController.deleteEmergencyProtocol);

export default router;
