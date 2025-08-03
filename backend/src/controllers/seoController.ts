import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import * as seoService from '../services/seoService';

const prisma = new PrismaClient();

export const getRentalSeoData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId } = req.params;
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId }
    });

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    const seoData = seoService.prepareRentalSeoData(rental);
    const metaTags = seoService.generateMetaTags(seoData);
    const jsonLd = seoService.generateJsonLd(seoData);

    res.json({
      slug: rental.slug,
      ...metaTags,
      jsonLd,
    });
  } catch (error) {
    next(error);
  }
};

// Legacy function for backward compatibility
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

    if (!listing.unit) {
      return next(new AppError('No unit found for this listing', 404));
    }

    const listingWithSingleUnit = {
      ...listing,
      unit: listing.unit,
    };

    const seoData = seoService.prepareListingSeoData(listingWithSingleUnit);
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
