import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorMiddleware';
import fs from 'fs';
import path from 'path';

// Interface for file upload response
interface FileUploadResult {
  filename: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

/**
 * Upload a single file for orders
 */
export const uploadSingle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;

    if (!file) {
      return next(new AppError('No file provided', 400));
    }

    // Generate file URL (assuming files are served from /uploads path)
    const fileUrl = `/uploads/orders/${file.filename}`;

    const result: FileUploadResult = {
      filename: file.filename,
      originalFilename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
      uploadedAt: new Date(),
    };

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload image only for orders (similar to uploadSingle but with image-specific validation)
 */
export const uploadImageOnly = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;

    if (!file) {
      return next(new AppError('No image file provided', 400));
    }

    // Validate that the uploaded file is an image
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(file.mimetype)) {
      // Clean up uploaded file if validation fails
      if (file.path) {
        fs.unlinkSync(file.path);
      }
      return next(new AppError('Only image files are allowed (JPEG, PNG, GIF, WebP)', 400));
    }

    // Generate file URL
    const fileUrl = `/uploads/orders/${file.filename}`;

    const result: FileUploadResult = {
      filename: file.filename,
      originalFilename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
      uploadedAt: new Date(),
    };

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple files for orders
 */
export const uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return next(new AppError('No files provided', 400));
    }

    const results: FileUploadResult[] = files.map(file => ({
      filename: file.filename,
      originalFilename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/orders/${file.filename}`,
      uploadedAt: new Date(),
    }));

    return res.status(200).json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete uploaded file
 */
export const deleteUploadedFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return next(new AppError('Filename is required', 400));
    }

    const filePath = path.join('uploads/orders/', filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      return next(new AppError('File not found', 404));
    }
  } catch (error) {
    next(error);
  }
};