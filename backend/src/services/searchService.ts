import { prisma } from '../config/database';
import { PropertyType } from '@prisma/client';
import { handleDatabaseError, getPaginationParams, buildSortParams } from '../utils/dbUtils';

/**
 * Interface for property search parameters
 */
export interface PropertySearchParams {
  // Basic filters
  query?: string;                     // Full-text search term
  propertyType?: PropertyType;        // Type of property
  city?: string;                      // City
  state?: string;                     // State
  zipCode?: string;                   // Zip code
  
  // Price range
  minRent?: number;                   // Minimum rent
  maxRent?: number;                   // Maximum rent
  
  // Unit features
  bedrooms?: number;                  // Minimum number of bedrooms
  bathrooms?: number;                 // Minimum number of bathrooms
  minSize?: number;                   // Minimum square footage
  maxSize?: number;                   // Maximum square footage
  
  // Availability
  isAvailable?: boolean;              // Only show available units
  availableFrom?: Date;               // Available from date
  
  // Amenities (as array of strings)
  amenities?: string[];               // Required amenities

  // Location-based search
  latitude?: number;                  // Center latitude for proximity search
  longitude?: number;                 // Center longitude for proximity search
  radius?: number;                    // Search radius in miles
  
  // For managers/owners
  managerId?: string;                 // Filter by property manager
  ownerId?: string;                   // Filter by owner
  isActive?: boolean;                 // Include inactive properties
  
  // For unit search
  rentalId?: string;                  // Filter units by rental ID
  
  // Sorting and pagination
  sortField?: string;                 // Field to sort by
  sortOrder?: 'asc' | 'desc';         // Sort direction
  page?: number;                      // Page number
  limit?: number;                     // Items per page
}

/**
 * Search service for advanced property and unit search capabilities
 */
export class SearchService {
  /**
   * Search for properties with advanced filtering and full-text search
   */
  async searchProperties(params: PropertySearchParams) {
    try {
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
        sortField = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = params;

      // Build the base where clause
      let where: any = {
        isActive: isActive !== undefined ? isActive : true
      };

      // Basic property filters
      if (propertyType) {
        where.propertyType = propertyType;
      }

      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }

      if (state) {
        where.state = { contains: state, mode: 'insensitive' };
      }

      if (zipCode) {
        where.zipCode = { contains: zipCode };
      }

      if (managerId) {
        where.managerId = managerId;
      }

      if (ownerId) {
        where.ownerId = ownerId;
      }

      // Full-text search across multiple fields
      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Add rent filters directly to rental model
      if (minRent !== undefined) {
        where.rent = { ...(where.rent || {}), gte: minRent };
      }

      if (maxRent !== undefined) {
        where.rent = { ...(where.rent || {}), lte: maxRent };
      }

      // Add bedroom filter
      if (bedrooms !== undefined) {
        where.bedrooms = { gte: bedrooms };
      }

      // Add bathroom filter
      if (bathrooms !== undefined) {
        where.bathrooms = { gte: bathrooms };
      }

      // Add size filters
      if (minSize !== undefined) {
        where.size = { ...(where.size || {}), gte: minSize };
      }

      if (maxSize !== undefined) {
        where.size = { ...(where.size || {}), lte: maxSize };
      }

      // Add availability filter
      if (isAvailable !== undefined) {
        where.isAvailable = isAvailable;
      }

      // Add available date filter
      if (availableFrom) {
        where.availableDate = { lte: new Date(availableFrom) };
      }

      // Geolocation proximity search
      if (latitude !== undefined && longitude !== undefined && radius !== undefined) {
        // For PostgreSQL, we'd use PostGIS extension and the ST_DWithin function
        // Since this requires a custom setup, we'll simulate by filtering in application code
        // In a real app, you'd set up PostGIS and use a raw query here
        // For demonstration, we'll fetch properties with coordinates and filter later
        where.latitude = { not: null };
        where.longitude = { not: null };
      }

      // Get pagination parameters
      const { skip, take } = getPaginationParams(page, limit);

      // Build sort parameters
      const orderBy = buildSortParams(sortField, sortOrder);

      // Execute count and query in parallel
      const [totalCount, properties] = await Promise.all([
        // Count query - using rental instead of property
        prisma.rental.count({ where }),
        
        // Main query - using rental instead of property
        prisma.rental.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            Manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            Owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            RentalImages: {
              where: {
                isFeatured: true
              },
              take: 1
            }
          }
        })
      ]);

      // Apply geospatial filtering if needed
      let filteredProperties = properties;
      let filteredCount = totalCount;
      
      if (latitude !== undefined && longitude !== undefined && radius !== undefined) {
        filteredProperties = properties.filter((property: any) => {
          if (!property.latitude || !property.longitude) return false;
          
          // Calculate distance in miles using Haversine formula
          const distance = calculateDistance(
            latitude, 
            longitude, 
            property.latitude, 
            property.longitude
          );
          
          // Add distance property to each property for sorting
          (property as any).distance = distance;
          
          // Filter by radius
          return distance <= radius;
        });
        
        // If sorting by distance, sort the filtered properties
        if (sortField === 'distance') {
          filteredProperties.sort((a: any, b: any) => {
            const distA = (a as any).distance || 0;
            const distB = (b as any).distance || 0;
            return sortOrder === 'asc' ? distA - distB : distB - distA;
          });
        }
        
        // Adjust count for the filtered results
        filteredCount = filteredProperties.length;
      }

      // Apply amenities filtering if needed
      if (amenities && amenities.length > 0) {
        filteredProperties = filteredProperties.filter((property: any) => {
          if (!property.amenities) return false;
          
          // Parse amenities if it's a string
          const propertyAmenities = typeof property.amenities === 'string' 
            ? JSON.parse(property.amenities) 
            : property.amenities;
            
          // Check if all required amenities are included
          return amenities.every((amenity: string) => 
            propertyAmenities.includes(amenity)
          );
        });
        
        // Adjust count for the filtered results
        filteredCount = filteredProperties.length;
      }

      // Calculate pagination
      const totalPages = Math.ceil(filteredCount / limit);

      return {
        properties: filteredProperties,
        total: filteredCount,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Search for available units with advanced filtering
   * Note: Since there's no separate Unit model, this searches Rental records
   * that represent individual units or unit-like properties
   */
  async searchAvailableUnits(params: PropertySearchParams) {
    try {
      const {
        bedrooms,
        bathrooms,
        minRent,
        maxRent,
        minSize,
        maxSize,
        availableFrom,
        rentalId,
        sortField = 'rent',
        sortOrder = 'asc',
        page = 1,
        limit = 10
      } = params;

      // Build the base where clause
      let where: any = {
        isAvailable: true
      };

      // Add rental ID filter if provided
      if (rentalId) {
        where.id = rentalId;
      }

      // Add available date filter
      if (availableFrom) {
        where.availableDate = { lte: new Date(availableFrom) };
      }

      // Add bedroom filter
      if (bedrooms !== undefined) {
        where.bedrooms = { gte: bedrooms };
      }

      // Add bathroom filter
      if (bathrooms !== undefined) {
        where.bathrooms = { gte: bathrooms };
      }

      // Add size filters
      if (minSize !== undefined) {
        where.size = { ...(where.size || {}), gte: minSize };
      }

      if (maxSize !== undefined) {
        where.size = { ...(where.size || {}), lte: maxSize };
      }

      // Add rent filters
      if (minRent !== undefined) {
        where.rent = { ...(where.rent || {}), gte: minRent };
      }

      if (maxRent !== undefined) {
        where.rent = { ...(where.rent || {}), lte: maxRent };
      }

      // Get pagination parameters
      const { skip, take } = getPaginationParams(page, limit);

      // Build sort parameters
      const orderBy = buildSortParams(sortField, sortOrder);

      // Execute count and query in parallel
      const [count, units] = await Promise.all([
        // Count query - using rental instead of unit
        prisma.rental.count({ where }),
        
        // Main query - using rental instead of unit
        prisma.rental.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            RentalImages: {
              where: {
                isFeatured: true
              },
              take: 1
            }
          }
        })
      ]);

      // Calculate pagination
      const totalPages = Math.ceil(count / limit);

      return {
        units,
        total: count,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Export singleton instance
export const searchService = new SearchService();