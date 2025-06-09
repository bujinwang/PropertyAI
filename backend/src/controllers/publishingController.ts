import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/dbManager';
import { AppError } from '../middleware/errorMiddleware';
import * as publishingService from '../services/publishingService';

export const publishListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId, platforms } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });

    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    const results = await publishingService.publishToListingPlatforms(listing, platforms);
    res.json(results);
  } catch (error) {
    next(error);
  }
};
