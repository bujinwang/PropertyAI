import { Router } from 'express';
import { propertyDescriptionController } from '../controllers/propertyDescription.controller';

const router = Router();

router.post('/:propertyId/generate-description', propertyDescriptionController.generateDescription);

export default router;
