import { Router } from 'express';
import { imageController } from '../controllers/imageController';
import { configureUpload } from '../config/storage';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Middleware for file uploads
const propertyImagesUpload = configureUpload('properties', 10 * 1024 * 1024); // 10MB limit
const unitImagesUpload = configureUpload('units', 10 * 1024 * 1024); // 10MB limit

// Property image routes
router.post(
  '/properties/:propertyId/images',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  propertyImagesUpload.array('images', 10), // Allow up to 10 images at once
  imageController.uploadPropertyImages
);

router.get(
  '/properties/:propertyId/images',
  authMiddleware.verifyToken,
  imageController.getPropertyImages
);

router.delete(
  '/properties/images/:imageId',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  imageController.deletePropertyImage
);

router.patch(
  '/properties/:propertyId/images/:imageId/featured',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  imageController.setFeaturedPropertyImage
);

// Unit image routes
router.post(
  '/units/:unitId/images',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  unitImagesUpload.array('images', 10), // Allow up to 10 images at once
  imageController.uploadUnitImages
);

router.get(
  '/units/:unitId/images',
  authMiddleware.verifyToken,
  imageController.getUnitImages
);

router.delete(
  '/units/images/:imageId',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  imageController.deleteUnitImage
);

router.patch(
  '/units/:unitId/images/:imageId/featured',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  imageController.setFeaturedUnitImage
);

export default router; 