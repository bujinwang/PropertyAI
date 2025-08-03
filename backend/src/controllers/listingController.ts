/**
 * @deprecated This controller has been deprecated in favor of rentalController.
 * All Listing functionality has been consolidated into the Rental model.
 * 
 * Migration Guide:
 * - Use /api/rentals instead of /api/listings
 * - Listing data is now stored in the Rental model with isActive: true
 * 
 * This file will be removed in a future version.
 */

import { Request, Response } from 'express';

const DEPRECATION_MESSAGE = {
  status: 'error',
  message: 'This endpoint has been deprecated. Please use /api/rentals instead.',
  migration: {
    'GET /api/listings': 'GET /api/rentals?isActive=true',
    'GET /api/listings/:id': 'GET /api/rentals/:id',
    'POST /api/listings': 'POST /api/rentals (with isActive: true)',
    'PUT /api/listings/:id': 'PUT /api/rentals/:id',
    'DELETE /api/listings/:id': 'DELETE /api/rentals/:id'
  },
  documentation: '/api/rentals/docs'
};

export const getPublicListings = async (req: Request, res: Response) => {
  return res.status(410).json(DEPRECATION_MESSAGE);
};

class ListingController {
  async getAllListings(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async createListing(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async getListingById(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async updateListing(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async deleteListing(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }
}

export default new ListingController();
