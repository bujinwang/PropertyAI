import { Router } from 'express';
import LeaseController from '../controllers/leaseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware.protect, LeaseController.getAllLeases);
router.post('/', authMiddleware.protect, LeaseController.createLease);
router.get('/:id', authMiddleware.protect, LeaseController.getLeaseById);
router.put('/:id', authMiddleware.protect, LeaseController.updateLease);
router.delete('/:id', authMiddleware.protect, LeaseController.deleteLease);

export default router;
