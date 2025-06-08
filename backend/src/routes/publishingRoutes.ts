import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import publishingController from '../controllers/publishingController';

const router = Router();

// @route   POST api/publish
// @desc    Publish a listing to a platform
// @access  Private (Property Manager or Admin)
router.post(
  '/',
  [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])],
  publishingController.publishListing
);

export default router;