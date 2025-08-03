import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/dbManager';
import { AppError } from '../middleware/errorMiddleware';
import * as publishingService from '../services/publishingService';

export const publishListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId, platforms } = req.body; // Changed from listingId to rentalId
    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    const results = await publishingService.publishToListingPlatforms(rental, platforms);
    res.json(results);
  } catch (error) {
    next(error);
  }
};
