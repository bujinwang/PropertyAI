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

    // TODO: Re-implement listing images - ListingImage model was removed
    // For now, return a placeholder response to fix compilation
    const image = {
      id: 'temp-id',
      listingId,
      url: optimizedImage.url,
      isFeatured: req.body.isFeatured || false,
    };

    res.status(201).json(image);
  } catch (error) {
    next(error);
  }
};
