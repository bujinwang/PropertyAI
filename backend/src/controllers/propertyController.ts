import { Request, Response } from 'express';

/**
 * DEPRECATED: Property Controller
 * 
 * This controller has been deprecated as part of the migration to the unified Rental model.
 * All property operations have been consolidated into the Rental model.
 * 
 * Migration Guide:
 * - Use /api/rentals endpoints instead of /api/propertys
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
export const getAllPropertys = deprecatedResponse;
export const createProperty = deprecatedResponse;
export const getPropertyById = deprecatedResponse;
export const updateProperty = deprecatedResponse;
export const deleteProperty = deprecatedResponse;
export const getPublicPropertys = deprecatedResponse;

// Export default for backward compatibility
export default {
  getAllPropertys,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPublicPropertys
};
