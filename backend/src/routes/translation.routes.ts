import { Router } from 'express';
import * as translationController from '../controllers/translation.controller';

const router = Router();

router.post('/translate', translationController.translateText);

export default router;
