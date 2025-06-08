import { Router } from 'express';
import PropertyController from '../controllers/propertyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, PropertyController.getAllProperties);
router.post('/', authMiddleware, PropertyController.createProperty);
router.get('/:id', authMiddleware, PropertyController.getPropertyById);
router.put('/:id', authMiddleware, PropertyController.updateProperty);
router.delete('/:id', authMiddleware, PropertyController.deleteProperty);

export default router;
