import { Router } from 'express';
import * as escalationPolicyController from '../controllers/escalationPolicy.controller';

const router = Router();

router.get('/properties/:propertyId/escalation-policies', escalationPolicyController.getEscalationPoliciesByPropertyId);
router.post('/escalation-policies', escalationPolicyController.createEscalationPolicy);
router.put('/escalation-policies/:id', escalationPolicyController.updateEscalationPolicy);
router.delete('/escalation-policies/:id', escalationPolicyController.deleteEscalationPolicy);

router.post('/escalation-policy-rules', escalationPolicyController.createEscalationPolicyRule);
router.put('/escalation-policy-rules/:id', escalationPolicyController.updateEscalationPolicyRule);
router.delete('/escalation-policy-rules/:id', escalationPolicyController.deleteEscalationPolicyRule);

export default router;
