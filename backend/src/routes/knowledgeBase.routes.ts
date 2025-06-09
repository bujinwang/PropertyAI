import { Router } from 'express';
import * as knowledgeBaseController from '../controllers/knowledgeBase.controller';

const router = Router();

router.get('/solution', knowledgeBaseController.getSolution);
router.post('/', knowledgeBaseController.addKnowledgeBaseEntry);

export default router;
