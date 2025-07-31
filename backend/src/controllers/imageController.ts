import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/dbManager';
import { AppError } from '../middleware/errorMiddleware';
import imageService from '../services/imageService';

export const uploadListingImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId } = req.params;
    const file = req.file;

    if (!file) {
      return next(new AppError('No image file provided', 400));
    }

    const optimizedImage = await imageService.enhanceAndOptimize(file);

    const image = await prisma.listingImage.create({
      data: {
        listingId,
        url: optimizedImage.url,
        isFeatured: req.query.featured === 'true', // Assuming 'featured' is a query param
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
