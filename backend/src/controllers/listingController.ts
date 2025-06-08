import { Request, Response, NextFunction } from 'express';
import listingService from '../services/listingService';

export const listingController = {
  async createListing(req: Request, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.create(req.body, req.user!.id);
      res.status(201).json(listing);
    } catch (error) {
      next(error);
    }
  },

  async getAllListings(req: Request, res: Response, next: NextFunction) {
    try {
      const listings = await listingService.findAll();
      res.json(listings);
    } catch (error) {
      next(error);
    }
  },

  async getListingById(req: Request, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.findById(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      res.json(listing);
    } catch (error) {
      next(error);
    }
  },

  async updateListing(req: Request, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.update(req.params.id, req.body);
      res.json(listing);
    } catch (error) {
      next(error);
    }
  },

  async deleteListing(req: Request, res: Response, next: NextFunction) {
    try {
      await listingService.remove(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async generateDescription(req: Request, res: Response, next: NextFunction) {
    try {
      const { listingId } = req.params;
      const description = await listingService.generateDescription(listingId);
      res.json({ description });
    } catch (error) {
      next(error);
    }
  },

  async generatePriceRecommendation(req: Request, res: Response, next: NextFunction) {
    try {
      const { listingId } = req.params;
      const recommendation = await listingService.generatePriceRecommendation(listingId);
      res.json(recommendation);
    } catch (error) {
      next(error);
    }
  },
};

export default listingController;