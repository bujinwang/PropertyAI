import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication to all audit routes
router.use(authMiddleware.protect);

// Audit log endpoints
router.post('/log', auditController.createLog);
router.get('/logs', auditController.getLogs);
router.get('/trail/:entityType/:entityId', auditController.getEntityTrail);
router.get('/stats', auditController.getStats);
router.post('/compliance', auditController.logComplianceAction);

export default router;
