import { Router } from 'express';
import ManualReviewController from '../controllers/manualReviewController';

const router = Router();

router.get('/', ManualReviewController.getApplicationsForReview);
router.put('/:id/approve', ManualReviewController.approveApplication);
router.put('/:id/reject', ManualReviewController.rejectApplication);

export default router;
