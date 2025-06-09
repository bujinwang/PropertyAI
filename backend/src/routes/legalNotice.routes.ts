import { Router } from 'express';
import * as legalNoticeController from '../controllers/legalNotice.controller';

const router = Router();

router.post('/', legalNoticeController.sendLegalNotice);

export default router;
