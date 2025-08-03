import { Router } from 'express';
import PropertyController from '../controllers/propertyController';

const router = Router();

// All routes now return deprecation notices
router.get('/', PropertyController.getAllPropertys);
router.post('/', PropertyController.createProperty);
router.get('/public/listings', PropertyController.getPublicPropertys);
router.get('/:id', PropertyController.getPropertyById);
router.put('/:id', PropertyController.updateProperty);
router.delete('/:id', PropertyController.deleteProperty);

export default router;
