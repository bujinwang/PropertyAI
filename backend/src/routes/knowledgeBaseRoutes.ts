import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { checkRole } from '../middleware/auth';
import KnowledgeBaseController from '../controllers/knowledgeBaseController';

/**
 * Shared knowledge-base content.
 *
 * Reads are open to any authenticated user: this is reference material the apps
 * surface in help screens, and there is nothing tenant-specific in it.
 *
 * Writes are operator-only. The rows are GLOBAL — there is no per-tenant
 * ownership to scope them by — so a role gate is the correct and sufficient
 * control here (unlike a per-row surface, where `checkRole` cannot answer "is
 * this yours?"). Without it any authenticated TENANT could rewrite or delete
 * every entry, i.e. edit shared content for every other user.
 *
 * Note the router previously carried NO middleware at all; only
 * `app.use('/api', requireAuth)` authenticated it, which is why the missing
 * authorization was invisible to an anonymous probe.
 */
const router = Router();

const KNOWLEDGE_BASE_EDITORS: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.PROPERTY_MANAGER,
];

router.get('/', KnowledgeBaseController.getEntries);
router.get('/:id', KnowledgeBaseController.getEntry);

router.post('/', checkRole([...KNOWLEDGE_BASE_EDITORS]), KnowledgeBaseController.createEntry);
router.put('/:id', checkRole([...KNOWLEDGE_BASE_EDITORS]), KnowledgeBaseController.updateEntry);
router.delete('/:id', checkRole([...KNOWLEDGE_BASE_EDITORS]), KnowledgeBaseController.deleteEntry);

export default router;
