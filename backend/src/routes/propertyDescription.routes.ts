import { Router } from 'express';
import { propertyDescriptionController } from '../controllers/propertyDescription.controller';

const router = Router();

router.post('/generate-description', propertyDescriptionController.generateDescription);

export default router;
