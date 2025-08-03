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

// Legacy function for backward compatibility - now redirects to rental
export const getSeoData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId } = req.params;
    
    // Try to find a rental with this ID (assuming listingId maps to rentalId)
    const rental = await prisma.rental.findUnique({
      where: { id: listingId }
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
