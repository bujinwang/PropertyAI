import { Router } from 'express';
import KnowledgeBaseController from '../controllers/knowledgeBaseController';

const router = Router();

router.post('/', KnowledgeBaseController.createEntry);
router.get('/:id', KnowledgeBaseController.getEntry);
router.get('/', KnowledgeBaseController.getEntries);
router.put('/:id', KnowledgeBaseController.updateEntry);
router.delete('/:id', KnowledgeBaseController.deleteEntry);

export default router;
