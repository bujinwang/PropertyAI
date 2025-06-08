import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export const createListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await prisma.listing.create({
      data: req.body,
    });
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await prisma.listing.findMany();
    res.json(listings);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }
    res.json(listing);
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.update({
      where: { id },
      data: req.body,
    });
    res.json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.listing.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
