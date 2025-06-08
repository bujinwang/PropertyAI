import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import * as aiController from '../controllers/aiController';

const router = Router();

// @route   POST api/ai/description/:listingId
// @desc    Generate a listing description
// @access  Private (Property Manager or Admin)
router.post(
  '/description/:listingId',
  [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])],
  aiController.generateDescription
);

// @route   POST api/ai/price/:listingId
// @desc    Generate a price recommendation
// @access  Private (Property Manager or Admin)
router.post(
  '/price/:listingId',
  [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])],
  aiController.generatePrice
);

// @route   POST api/ai/analyze-image
// @desc    Analyze an image
// @access  Private (Property Manager or Admin)
router.post(
  '/analyze-image',
  [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])],
  aiController.analyzeImage
);

export default router;
