import { Request, Response } from 'express';

/**
 * DEPRECATED: Listing Controller
 * 
 * This controller has been deprecated as part of the migration to the unified Rental model.
 * All listing operations have been consolidated into the Rental model.
 * 
 * Migration Guide:
 * - Use /api/rentals endpoints instead of /api/listings
 * - Update your client code to use rentalService
 * - See MIGRATION_GUIDE.md for detailed mapping
 * 
 * This controller will be removed in the next major version.
 */

const deprecatedResponse = (req: Request, res: Response) => {
  res.status(410).json({
    error: 'Endpoint Deprecated',
    message: `The ${req.originalUrl} endpoint has been deprecated and consolidated into the Rental model.`,
    migration: {
      newEndpoint: '/api/rentals',
      documentation: '/docs/migration-guide',
      deprecatedSince: '2025-01-02',
      removalDate: '2025-02-01'
    }
  });
};

// All legacy endpoints return deprecation notice
export const getAllListings = deprecatedResponse;
export const createListing = deprecatedResponse;
export const getListingById = deprecatedResponse;
export const updateListing = deprecatedResponse;
export const deleteListing = deprecatedResponse;
export const getPublicListings = deprecatedResponse;

// Export default for backward compatibility
export default {
  getAllListings,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
  getPublicListings
};
