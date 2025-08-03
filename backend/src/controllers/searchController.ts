import { Request, Response } from 'express';
import { searchService, PropertySearchParams } from '../services/searchService';
import { PropertyType } from '@prisma/client';
import { formatErrorResponse } from '../utils/errorUtils';

/**
 * Controller for handling property and unit search endpoints
 */
export class SearchController {
  /**
   * Search for properties with advanced filtering
   */
  async searchProperties(req: Request, res: Response): Promise<Response> {
    try {
      // Get all query parameters
      const {
        query,
        propertyType,
        city,
        state,
        zipCode,
        minRent,
        maxRent,
        bedrooms,
        bathrooms,
        minSize,
        maxSize,
        isAvailable,
        availableFrom,
        amenities,
        latitude,
        longitude,
        radius,
        managerId,
        ownerId,
        isActive,
        sortField,
        sortOrder,
        page = '1',
        limit = '10'
      } = req.query;

      // Build search parameters
      const searchParams: PropertySearchParams = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      };

      // Add text search query if provided
      if (query) {
        searchParams.query = query as string;
      }

      // Add location filters if provided
      if (city) searchParams.city = city as string;
      if (state) searchParams.state = state as string;
      if (zipCode) searchParams.zipCode = zipCode as string;

      // Add property type if provided and valid
      if (propertyType && Object.values(PropertyType).includes(propertyType as PropertyType)) {
        searchParams.propertyType = propertyType as PropertyType;
      }

      // Add rent range if provided
      if (minRent) searchParams.minRent = parseFloat(minRent as string);
      if (maxRent) searchParams.maxRent = parseFloat(maxRent as string);

      // Add unit features if provided
      if (bedrooms) searchParams.bedrooms = parseInt(bedrooms as string, 10);
      if (bathrooms) searchParams.bathrooms = parseFloat(bathrooms as string);
      if (minSize) searchParams.minSize = parseFloat(minSize as string);
      if (maxSize) searchParams.maxSize = parseFloat(maxSize as string);

      // Add availability filters if provided
      if (isAvailable !== undefined) {
        searchParams.isAvailable = isAvailable === 'true';
      }
      if (availableFrom) {
        searchParams.availableFrom = new Date(availableFrom as string);
      }

      // Add amenities filter if provided
      if (amenities) {
        searchParams.amenities = Array.isArray(amenities)
          ? amenities as string[]
          : [amenities as string];
      }

      // Add geolocation search if all required parameters are provided
      if (latitude && longitude && radius) {
        searchParams.latitude = parseFloat(latitude as string);
        searchParams.longitude = parseFloat(longitude as string);
        searchParams.radius = parseFloat(radius as string);
      }

      // Add owner/manager filters if provided
      if (managerId) searchParams.managerId = managerId as string;
      if (ownerId) searchParams.ownerId = ownerId as string;
      if (isActive !== undefined) {
        searchParams.isActive = isActive === 'true';
      }

      // Add sorting if provided
      if (sortField) searchParams.sortField = sortField as string;
      if (sortOrder && ['asc', 'desc'].includes(sortOrder as string)) {
        searchParams.sortOrder = sortOrder as 'asc' | 'desc';
      }

      // Execute search
      const results = await searchService.searchProperties(searchParams);

      return res.status(200).json({
        status: 'success',
        data: results
      });
    } catch (error) {
      console.error('Error searching properties:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  }

  /**
   * Search for available units with advanced filtering
   */
  async searchAvailableUnits(req: Request, res: Response): Promise<Response> {
    try {
      // Get all query parameters
      const {
        rentalId, // Changed from propertyId to rentalId
        bedrooms,
        bathrooms,
        minRent,
        maxRent,
        minSize,
        maxSize,
        availableFrom,
        sortField,
        sortOrder,
        page = '1',
        limit = '10'
      } = req.query;

      // Build search parameters
      const searchParams: PropertySearchParams = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        isAvailable: true
      };

      // Add rental ID filter if provided
      if (rentalId) {
        searchParams.rentalId = rentalId as string; // Changed from propertyId to rentalId
      }

      // Add unit features if provided
      if (bedrooms) searchParams.bedrooms = parseInt(bedrooms as string, 10);
      if (bathrooms) searchParams.bathrooms = parseFloat(bathrooms as string);
      if (minSize) searchParams.minSize = parseFloat(minSize as string);
      if (maxSize) searchParams.maxSize = parseFloat(maxSize as string);

      // Add rent range if provided
      if (minRent) searchParams.minRent = parseFloat(minRent as string);
      if (maxRent) searchParams.maxRent = parseFloat(maxRent as string);

      // Add available date if provided
      if (availableFrom) {
        searchParams.availableFrom = new Date(availableFrom as string);
      }

      // Add sorting if provided
      if (sortField) searchParams.sortField = sortField as string;
      if (sortOrder && ['asc', 'desc'].includes(sortOrder as string)) {
        searchParams.sortOrder = sortOrder as 'asc' | 'desc';
      }

      // Execute search
      const results = await searchService.searchAvailableUnits(searchParams);

      return res.status(200).json({
        status: 'success',
        data: results
      });
    } catch (error) {
      console.error('Error searching available units:', error);
      const { statusCode, response } = formatErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  }

  /**
   * Get property type enum values
   */
  getPropertyTypes(req: Request, res: Response): Response {
    return res.status(200).json({
      status: 'success',
      data: Object.values(PropertyType)
    });
  }
}

// Export singleton instance
export const searchController = new SearchController();