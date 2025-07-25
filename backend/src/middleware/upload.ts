import multer from 'multer';
import { Request } from 'express';

interface UploadConfig {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  destination?: string;
}

const defaultConfig: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
  ],
  maxFiles: 5,
  destination: 'uploads',
};

export const createUploadMiddleware = (config: UploadConfig = {}) => {
  const finalConfig = { ...defaultConfig, ...config };

  const storage = multer.memoryStorage();

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (finalConfig.allowedMimeTypes?.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  };

  return multer({
    storage,
    limits: {
      fileSize: finalConfig.maxFileSize,
      files: finalConfig.maxFiles,
    },
    fileFilter,
  });
};

// Pre-configured middleware instances
export const uploadSingle = createUploadMiddleware().single('file');
export const uploadMultiple = createUploadMiddleware().array('files', 10);
export const uploadImages = createUploadMiddleware({
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize: 5 * 1024 * 1024, // 5MB for images
}).array('images', 10);

export const uploadDocuments = createUploadMiddleware({
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  maxFileSize: 10 * 1024 * 1024, // 10MB for documents
}).single('document');

export const uploadPropertyImages = createUploadMiddleware({
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize: 8 * 1024 * 1024, // 8MB for property images
  maxFiles: 20,
}).array('images', 20);

export const uploadAvatar = createUploadMiddleware({
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize: 2 * 1024 * 1024, // 2MB for avatars
}).single('avatar');