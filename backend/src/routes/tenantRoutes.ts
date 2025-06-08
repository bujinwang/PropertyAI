import { Router } from 'express';
import TenantController from '../controllers/tenantController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, TenantController.getAllTenants);

export default router;
