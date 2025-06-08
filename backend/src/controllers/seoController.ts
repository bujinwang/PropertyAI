import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import * as seoService from '../services/seoService';

const prisma = new PrismaClient();

export const getSeoData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId } = req.params;
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { property: true, unit: true },
    });

    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    const seoData = seoService.prepareListingSeoData(listing);
    const metaTags = seoService.generateMetaTags(seoData);
    const jsonLd = seoService.generateJsonLd(seoData);

    res.json({
      slug: listing.slug,
      ...metaTags,
      jsonLd,
    });
  } catch (error) {
    next(error);
  }
};
