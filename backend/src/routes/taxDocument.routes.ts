import { Router } from 'express';
import * as taxDocumentController from '../controllers/taxDocument.controller';

const router = Router();

router.get('/:propertyId/:year', taxDocumentController.generateTaxDocument);

export default router;
