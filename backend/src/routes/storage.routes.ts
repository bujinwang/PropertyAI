import { Router, Request, Response } from 'express';
import multer from 'multer';
import { User } from '@prisma/client';
import { storageService } from '../services/storage.service';
import { authenticateToken } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../config/database';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'video/quicktime',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and videos are allowed.'));
    }
  },
});

// Upload single file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const userId = (req.user as User)!.id;
    const options = req.body.options ? JSON.parse(req.body.options) : {};

    const result = await storageService.uploadFile(req.file, userId, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file',
    });
  }
});

// Upload multiple files
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
      });
    }

    const userId = (req.user as User)!.id;
    const options = req.body.options ? JSON.parse(req.body.options) : {};

    const results = await storageService.uploadMultipleFiles(req.files, userId, options);

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload files',
    });
  }
});

// Get file metadata
router.get('/files/:key/metadata', authenticateToken, [
  param('key').isString().notEmpty(),
  validateRequest,
], async (req, res) => {
  try {
    const { key } = req.params;
    const metadata = await storageService.getFileMetadata(key);

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get file metadata',
    });
  }
});

// Get signed URL for secure file access
router.post('/files/:key/signed-url', authenticateToken, [
  param('key').isString().notEmpty(),
  body('expiresIn').optional().isInt({ min: 60, max: 604800 }),
  validateRequest,
], async (req, res) => {
  try {
    const { key } = req.params;
    const { expiresIn = 3600 } = req.body;

    const signedUrl = await storageService.getSignedUrl(key, expiresIn);

    res.json({
      success: true,
      data: { signedUrl },
    });
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate signed URL',
    });
  }
});

// Delete file
router.delete('/files/:key', authenticateToken, [
  param('key').isString().notEmpty(),
  validateRequest,
], async (req, res) => {
  try {
    const { key } = req.params;
    const userId = (req.user as User)!.id;

    // Check if user owns this file
    const document = await prisma.document.findFirst({
      where: {
        key,
        uploadedById: userId,
      },
    });

    if (!document) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or file not found',
      });
    }

    await storageService.deleteFile(key);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete file',
    });
  }
});

// List user's files
router.get('/files', authenticateToken, [
  query('folder').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validateRequest,
], async (req, res) => {
  try {
    const userId = (req.user as User)!.id;
    const folder = req.query.folder as string | undefined;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const where = {
      uploadedById: userId,
      ...(folder && { key: { contains: folder as string } }),
    };

    const [files, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip: Number(offset),
        take: Number(limit),
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total,
        },
      },
    });
  } catch (error: any) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list files',
    });
  }
});

// Bulk delete files
router.delete('/files', authenticateToken, [
  body('keys').isArray().notEmpty(),
  body('keys.*').isString(),
  validateRequest,
], async (req, res) => {
  try {
    const userId = (req.user as User)!.id;
    const { keys } = req.body;

    // Check if user owns all files
    const documents = await prisma.document.findMany({
      where: {
        key: { in: keys },
        uploadedById: userId,
      },
    });

    if (documents.length !== keys.length) {
      return res.status(403).json({
        success: false,
        error: 'Access denied for some files',
      });
    }

    await storageService.bulkDelete(keys);

    res.json({
      success: true,
      message: 'Files deleted successfully',
    });
  } catch (error: any) {
    console.error('Error bulk deleting files:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete files',
    });
  }
});

// Upload property images
router.post('/properties/:propertyId/images', authenticateToken, upload.array('images', 10), [
  param('propertyId').isString().notEmpty(),
  validateRequest,
], async (req, res) => {
  try {
    const userId = (req.user as User)!.id;
    const { propertyId } = req.params;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided',
      });
    }

    // Verify user owns the rental (property)
    const rental = await prisma.rental.findFirst({
      where: {
        id: propertyId,
        ownerId: userId,
      },
    });

    if (!rental) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or property not found',
      });
    }

    const results = await storageService.uploadMultipleFiles(
      req.files,
      userId,
      {
        folder: `properties/${propertyId}/images`,
        generateThumbnail: true,
        resize: { width: 1920, height: 1080, quality: 85 },
      }
    );

    // Create rental images instead of property images
    const rentalImages = await Promise.all(
      results.map((result, index) =>
        prisma.rentalImage.create({
          data: {
            rentalId: propertyId,
            url: result.url,
            ...(result.thumbnailUrl && { thumbnailUrl: result.thumbnailUrl }),
            ...(req.body.captions?.[index] && { caption: req.body.captions[index] }),
            isPrimary: index === 0,
            order: index,
          },
        })
      )
    );

    res.json({
      success: true,
      data: rentalImages,
    });
  } catch (error: any) {
    console.error('Error uploading property images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload property images',
    });
  }
});

// Upload document for lease
router.post('/leases/:leaseId/documents', authenticateToken, upload.single('document'), [
  param('leaseId').isString().notEmpty(),
  body('documentType').isIn(['LEASE', 'INSURANCE', 'IDENTITY', 'OTHER']),
  body('name').optional().isString(),
  validateRequest,
], async (req, res) => {
  try {
    const userId = (req.user as User)!.id;
    const { leaseId } = req.params;
    const { documentType, name } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document provided',
      });
    }

    // Verify user has access to the lease
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        OR: [
          { tenantId: userId },
          { rental: { ownerId: userId } }, // Updated to use rental instead of unit.property
        ],
      },
    });

    if (!lease) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or lease not found',
      });
    }

    const result = await storageService.uploadFile(req.file, userId, {
      folder: `leases/${leaseId}/documents`,
    });

    const document = await prisma.document.create({
      data: {
        name: name || req.file.originalname,
        type: documentType,
        url: result.url,
        key: result.key,
        size: result.size,
        mimeType: result.mimeType,
        leaseId,
        uploadedById: userId,
      },
    });

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error('Error uploading lease document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload lease document',
    });
  }
});

export default router;