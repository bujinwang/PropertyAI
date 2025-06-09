import { Router } from 'express';
import * as signatureController from '../controllers/signature.controller';

const router = Router();

router.post('/sign-document', signatureController.signDocument);

export default router;
