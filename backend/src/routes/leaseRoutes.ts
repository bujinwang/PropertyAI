import { Router } from 'express';
import LeaseController from '../controllers/leaseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, LeaseController.getAllLeases);
router.post('/', authMiddleware, LeaseController.createLease);
router.get('/:id', authMiddleware, LeaseController.getLeaseById);
router.put('/:id', authMiddleware, LeaseController.updateLease);
router.delete('/:id', authMiddleware, LeaseController.deleteLease);

export default router;
