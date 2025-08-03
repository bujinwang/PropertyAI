import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/dbManager';
import { AppError } from '../middleware/errorMiddleware';
import imageService from '../services/imageService';

export const uploadListingImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId } = req.params;
    const file = req.file;

    if (!file) {
      return next(new AppError('No image file provided', 400));
    }

    const optimizedImage = await imageService.enhanceAndOptimize(file);

    const image = await prisma.rentalImage.create({
      data: {
        rentalId,
        filename: optimizedImage.filename || file.filename,
        originalFilename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: optimizedImage.url,
        cdnUrl: optimizedImage.cdnUrl,
        isFeatured: req.query.featured === 'true',
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: image,
    });
  } catch (error) {
    next(error);
  }
};
