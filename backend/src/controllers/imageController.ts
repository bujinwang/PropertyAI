import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errorMiddleware';
import imageService from '../services/imageService';

const prisma = new PrismaClient();

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
        isFeatured: req.body.isFeatured || false,
      },
    });

    res.status(201).json(image);
  } catch (error) {
    next(error);
  }
};
