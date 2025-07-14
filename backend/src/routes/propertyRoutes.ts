import { Router } from 'express';
import PropertyController from '../controllers/propertyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware.protect, PropertyController.getAllProperties);
router.post('/', authMiddleware.protect, PropertyController.createProperty);
router.get('/:id', authMiddleware.protect, PropertyController.getPropertyById);
router.put('/:id', authMiddleware.protect, PropertyController.updateProperty);
router.delete('/:id', authMiddleware.protect, PropertyController.deleteProperty);

export default router;
