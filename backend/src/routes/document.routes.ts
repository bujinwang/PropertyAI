import { Router } from 'express';
import * as documentController from '../controllers/document.controller';

const router = Router();

router.get('/:documentId', documentController.getDocumentUrl);

export default router;
