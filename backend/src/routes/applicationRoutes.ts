import { Router } from 'express';
import ApplicationController from '../controllers/applicationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware.protect, ApplicationController.getAllApplications);
router.post('/', authMiddleware.protect, ApplicationController.createApplication);
router.get('/:id', authMiddleware.protect, ApplicationController.getApplicationById);
router.put('/:id', authMiddleware.protect, ApplicationController.updateApplication);
router.delete('/:id', authMiddleware.protect, ApplicationController.deleteApplication);

export default router;
