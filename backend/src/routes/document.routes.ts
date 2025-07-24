import { Router } from 'express';
import DocumentController from '../controllers/document.controller';

const router = Router();

router.post('/generate-lease', DocumentController.generateLease);

export default router;
