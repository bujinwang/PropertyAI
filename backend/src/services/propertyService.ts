import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { handleDatabaseError, getPaginationParams, buildSortParams } from '../utils/dbUtils';
import { rentalService } from './rentalService';

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
   * @deprecated Use rentalService.createRental() instead
   * Create a new property
   * @param data Property data
   * @returns The created property
   */
  async createProperty(data: CreatePropertyDto): Promise<any> {
    console.warn('PropertyService.createProperty is deprecated. Use rentalService.createRental() instead.');
    
    try {
      // Map property data to rental data
      const rentalData = {
        title: data.name,
        description: data.description || '',
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || 'USA',
        propertyType: data.propertyType,
        rentalType: 'LONG_TERM' as const,
        bedrooms: 1, // Default value
        bathrooms: 1, // Default value
        size: 1000, // Default value
        rent: 1000, // Default value
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        yearBuilt: data.yearBuilt,
        totalUnits: data.totalUnits,
        managerId: data.managerId,
        ownerId: data.ownerId,
      };

      return await rentalService.createRental(rentalData);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.getRentalById() instead
   * Get a property by ID
   * @param id Property ID
   * @returns The property if found
   */
  async getPropertyById(id: string): Promise<any | null> {
    console.warn('PropertyService.getPropertyById is deprecated. Use rentalService.getRentalById() instead.');
    
    try {
      const rental = await rentalService.getRentalById(id);
      if (!rental) return null;

      // Map rental data to property format for backward compatibility
      return {
        id: rental.id,
        name: rental.title,
        address: rental.address,
        city: rental.city,
        state: rental.state,
        zipCode: rental.zipCode,
        country: rental.country,
        description: rental.description,
        propertyType: rental.propertyType,
        yearBuilt: rental.yearBuilt,
        totalUnits: rental.totalUnits,
        amenities: rental.amenities,
        createdAt: rental.createdAt,
        updatedAt: rental.updatedAt,
        isActive: rental.isAvailable,
        managerId: rental.managerId,
        ownerId: rental.ownerId,
        manager: rental.manager,
        owner: rental.owner,
        units: [], // Legacy field
        documents: [], // Legacy field
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.getRentals() instead
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
    console.warn('PropertyService.getProperties is deprecated. Use rentalService.getRentals() instead.');
    
    try {
      // Map property filters to rental filters
      const rentalFilters = {
        title: filters.name,
        city: filters.city,
        state: filters.state,
        zipCode: filters.zipCode,
        propertyType: filters.propertyType,
        managerId: filters.managerId,
        ownerId: filters.ownerId,
        isAvailable: filters.isActive,
      };

      const result = await rentalService.getRentals(
        rentalFilters,
        page,
        limit,
        sortField === 'name' ? 'title' : sortField,
        sortOrder
      );

      // Map rental data to property format for backward compatibility
      const properties = result.rentals.map((rental: any) => ({
        id: rental.id,
        name: rental.title,
        address: rental.address,
        city: rental.city,
        state: rental.state,
        zipCode: rental.zipCode,
        country: rental.country,
        description: rental.description,
        propertyType: rental.propertyType,
        yearBuilt: rental.yearBuilt,
        totalUnits: rental.totalUnits,
        amenities: rental.amenities,
        createdAt: rental.createdAt,
        updatedAt: rental.updatedAt,
        isActive: rental.isAvailable,
        managerId: rental.managerId,
        ownerId: rental.ownerId,
        manager: rental.manager,
        owner: rental.owner,
        units: [], // Legacy field
      }));

      return {
        properties,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.updateRental() instead
   * Update a property
   * @param id Property ID
   * @param data Update data
   * @returns The updated property
   */
  async updateProperty(id: string, data: UpdatePropertyDto): Promise<any> {
    console.warn('PropertyService.updateProperty is deprecated. Use rentalService.updateRental() instead.');
    
    try {
      // Map property data to rental data
      const rentalData: any = {};
      if (data.name) rentalData.title = data.name;
      if (data.description !== undefined) rentalData.description = data.description;
      if (data.address) rentalData.address = data.address;
      if (data.city) rentalData.city = data.city;
      if (data.state) rentalData.state = data.state;
      if (data.zipCode) rentalData.zipCode = data.zipCode;
      if (data.country) rentalData.country = data.country;
      if (data.propertyType) rentalData.propertyType = data.propertyType;
      if (data.yearBuilt) rentalData.yearBuilt = data.yearBuilt;
      if (data.totalUnits) rentalData.totalUnits = data.totalUnits;
      if (data.amenities) rentalData.amenities = Array.isArray(data.amenities) ? data.amenities : [];

      const rental = await rentalService.updateRental(id, rentalData);

      // Map rental data to property format for backward compatibility
      return {
        id: rental.id,
        name: rental.title,
        address: rental.address,
        city: rental.city,
        state: rental.state,
        zipCode: rental.zipCode,
        country: rental.country,
        description: rental.description,
        propertyType: rental.propertyType,
        yearBuilt: rental.yearBuilt,
        totalUnits: rental.totalUnits,
        amenities: rental.amenities,
        createdAt: rental.createdAt,
        updatedAt: rental.updatedAt,
        isActive: rental.isAvailable,
        managerId: rental.managerId,
        ownerId: rental.ownerId,
        manager: rental.manager,
        owner: rental.owner,
        units: [], // Legacy field
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.setRentalAvailability() instead
   * Set property active status
   * @param id Property ID
   * @param isActive Active status
   * @returns The updated property
   */
  async setPropertyStatus(id: string, isActive: boolean): Promise<any> {
    console.warn('PropertyService.setPropertyStatus is deprecated. Use rentalService.setRentalAvailability() instead.');
    
    try {
      const rental = await rentalService.setRentalAvailability(id, isActive);

      // Map rental data to property format for backward compatibility
      return {
        id: rental.id,
        name: rental.title,
        address: rental.address,
        city: rental.city,
        state: rental.state,
        zipCode: rental.zipCode,
        country: rental.country,
        description: rental.description,
        propertyType: rental.propertyType,
        yearBuilt: rental.yearBuilt,
        totalUnits: rental.totalUnits,
        amenities: rental.amenities,
        createdAt: rental.createdAt,
        updatedAt: rental.updatedAt,
        isActive: rental.isAvailable,
        managerId: rental.managerId,
        ownerId: rental.ownerId,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.setRentalAvailability() instead
   * Delete a property (soft delete by setting isActive to false)
   * @param id Property ID
   * @returns The deactivated property
   */
  async softDeleteProperty(id: string): Promise<any> {
    console.warn('PropertyService.softDeleteProperty is deprecated. Use rentalService.setRentalAvailability() instead.');
    return this.setPropertyStatus(id, false);
  }

  /**
   * @deprecated Use rentalService.deleteRental() instead
   * Permanently delete a property and related data
   * @param id Property ID
   * @returns True if successful
   */
  async hardDeleteProperty(id: string): Promise<boolean> {
    console.warn('PropertyService.hardDeleteProperty is deprecated. Use rentalService.deleteRental() instead.');
    
    try {
      await rentalService.deleteRental(id);
      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.getRentals() with grouping instead
   * Count properties by type
   * @returns Count of properties by type
   */
  async countPropertiesByType(): Promise<Record<string, number>> {
    console.warn('PropertyService.countPropertiesByType is deprecated. Use rentalService.getRentals() with grouping instead.');
    
    try {
      const counts = await prisma.rental.groupBy({
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
 