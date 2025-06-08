import { Router } from 'express';
import ApplicationController from '../controllers/applicationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, ApplicationController.getAllApplications);
router.post('/', authMiddleware, ApplicationController.createApplication);
router.get('/:id', authMiddleware, ApplicationController.getApplicationById);
router.put('/:id', authMiddleware, ApplicationController.updateApplication);
router.delete('/:id', authMiddleware, ApplicationController.deleteApplication);

export default router;
