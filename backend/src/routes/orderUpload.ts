import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware';
import * as orderUploadController from '../controllers/orderUploadController';

const router = Router();
const upload = multer({
  dest: 'uploads/orders/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.') as any, false);
    }
  }
});

// @route   POST /api/order-upload/image
// @desc    Upload a single image for orders
// @access  Private
router.post('/image', [
  authMiddleware.protect,
  upload.single('file'),
  orderUploadController.uploadImageOnly,
] as any);

// @route   POST /api/order-upload/single
// @desc    Upload a single file for orders
// @access  Private
router.post('/single', [
  authMiddleware.protect,
  upload.single('file'),
  orderUploadController.uploadSingle,
] as any);

// @route   POST /api/order-upload/multiple
// @desc    Upload multiple files for orders
// @access  Private
router.post('/multiple', [
  authMiddleware.protect,
  upload.array('files', 10), // Allow up to 10 files
  orderUploadController.uploadMultiple,
] as any);

export default router;