import { Router } from 'express';
import AuditController from '../controllers/auditController';

const router = Router();

router.post('/', AuditController.createEntry);
router.get('/', AuditController.getEntries);

export default router;
