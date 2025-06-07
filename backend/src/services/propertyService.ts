import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { handleDatabaseError, getPaginationParams, buildSortParams } from '../utils/dbUtils';

// Enum for property types matching Prisma schema
export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  OTHER = 'OTHER'
}

// Property interface based on Prisma schema
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description: string | null;
  propertyType: PropertyType;
  yearBuilt: number | null;
  totalUnits: number;
  amenities: any | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  managerId: string;
  ownerId: string;
}

// Type for creating a new property
export type CreatePropertyDto = {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  description?: string;
  propertyType: PropertyType;
  yearBuilt?: number;
  totalUnits: number;
  amenities?: Record<string, any>;
  managerId: string;
  ownerId: string;
};

// Type for updating a property
export type UpdatePropertyDto = Partial<CreatePropertyDto>;

// Property filter parameters
export type PropertyFilterParams = {
  name?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: PropertyType;
  minUnits?: number;
  maxUnits?: number;
  managerId?: string;
  ownerId?: string;
  isActive?: boolean;
};

// Service class for property operations
export class PropertyService {
  /**
   * Create a new property
   * @param data Property data
   * @returns The created property
   */
  async createProperty(data: CreatePropertyDto): Promise<any> {
    try {
      // Format amenities as JSON if provided
      const formattedData = {
        ...data,
        amenities: data.amenities ? data.amenities : undefined,
        country: data.country || 'USA',
        isActive: true
      };

      const property = await prisma.property.create({
        data: formattedData,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return property;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get a property by ID
   * @param id Property ID
   * @returns The property if found
   */
  async getPropertyById(id: string): Promise<any | null> {
    try {
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          units: true,
          documents: true
        }
      });

      return property;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get properties with filtering, pagination, and sorting
   * @param filters Filter parameters
   * @param page Page number (1-based)
   * @param limit Number of items per page
   * @param sortField Field to sort by
   * @param sortOrder Sort direction ('asc' or 'desc')
   * @returns Paginated properties
   */
  async getProperties(
    filters: PropertyFilterParams = {},
    page: number = 1,
    limit: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    properties: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Build where clause from filters
      const where: any = {
        ...(filters.name && {
          name: { contains: filters.name, mode: 'insensitive' }
        }),
        ...(filters.city && {
          city: { contains: filters.city, mode: 'insensitive' }
        }),
        ...(filters.state && {
          state: { contains: filters.state, mode: 'insensitive' }
        }),
        ...(filters.zipCode && {
          zipCode: { contains: filters.zipCode }
        }),
        ...(filters.propertyType && {
          propertyType: filters.propertyType
        }),
        ...(filters.minUnits && {
          totalUnits: { gte: filters.minUnits }
        }),
        ...(filters.maxUnits && {
          totalUnits: { lte: filters.maxUnits }
        }),
        ...(filters.managerId && {
          managerId: filters.managerId
        }),
        ...(filters.ownerId && {
          ownerId: filters.ownerId
        }),
        ...(filters.isActive !== undefined && {
          isActive: filters.isActive
        })
      };

      // Get pagination params
      const { skip, take } = getPaginationParams(page, limit);

      // Get sort params
      const orderBy = buildSortParams(sortField, sortOrder);

      // Execute count and findMany in parallel
      const [total, properties] = await Promise.all([
        prisma.property.count({ where }),
        prisma.property.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            units: {
              select: {
                id: true,
                unitNumber: true,
                isAvailable: true
              }
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        properties,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Update a property
   * @param id Property ID
   * @param data Update data
   * @returns The updated property
   */
  async updateProperty(id: string, data: UpdatePropertyDto): Promise<any> {
    try {
      // Format amenities as JSON if provided
      const formattedData = {
        ...data,
        amenities: data.amenities ? data.amenities : undefined,
      };

      const property = await prisma.property.update({
        where: { id },
        data: formattedData,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          units: true
        }
      });

      return property;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Set property active status
   * @param id Property ID
   * @param isActive Active status
   * @returns The updated property
   */
  async setPropertyStatus(id: string, isActive: boolean): Promise<any> {
    try {
      const property = await prisma.property.update({
        where: { id },
        data: { isActive }
      });

      return property;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Delete a property (soft delete by setting isActive to false)
   * @param id Property ID
   * @returns The deactivated property
   */
  async softDeleteProperty(id: string): Promise<any> {
    return this.setPropertyStatus(id, false);
  }

  /**
   * Permanently delete a property and related data
   * @param id Property ID
   * @returns True if successful
   */
  async hardDeleteProperty(id: string): Promise<boolean> {
    try {
      // Delete related units first
      await prisma.unit.deleteMany({
        where: { propertyId: id }
      });

      // Delete property documents
      await prisma.document.deleteMany({
        where: { propertyId: id }
      });

      // Delete the property
      await prisma.property.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Count properties by type
   * @returns Count of properties by type
   */
  async countPropertiesByType(): Promise<Record<string, number>> {
    try {
      const counts = await prisma.property.groupBy({
        by: ['propertyType'],
        _count: {
          id: true
        }
      });

      // Convert to record format
      const result: Record<string, number> = {};
      
      counts.forEach((count: any) => {
        if (count.propertyType) {
          result[count.propertyType] = count._count.id;
        }
      });

      // Ensure all property types are represented
      Object.values(PropertyType).forEach((type) => {
        if (result[type] === undefined) {
          result[type] = 0;
        }
      });

      return result;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
}

// Export a singleton instance
export const propertyService = new PropertyService();
 