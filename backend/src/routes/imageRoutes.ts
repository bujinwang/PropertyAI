import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/authMiddleware';
import * as imageController from '../controllers/imageController';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// @route   POST api/listings/:listingId/images
// @desc    Upload an image for a listing
// @access  Private (Property Manager or Admin)
router.post('/:listingId/images', [
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN']),
  upload.single('image'),
  imageController.uploadListingImage,
] as any);

export default router;
