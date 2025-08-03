import { prisma } from '../config/database';
import { handleDatabaseError, getPaginationParams, buildSortParams } from '../utils/dbUtils';
import { RentalService, CreateRentalDto, UpdateRentalDto, RentalFilterParams, RentalType, ListingStatus } from './rentalService';

// Initialize rental service for delegation
const rentalService = new RentalService();

// Type for creating a new unit
export type CreateUnitDto = {
  unitNumber: string;
  propertyId: string;
  floorNumber?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  deposit?: number;
  isAvailable?: boolean;
  dateAvailable?: Date;
  features?: Record<string, any>;
  tenantId?: string;
};

// Type for updating a unit
export type UpdateUnitDto = Partial<CreateUnitDto>;

// Unit filter parameters
export type UnitFilterParams = {
  unitNumber?: string;
  propertyId?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minRent?: number;
  maxRent?: number;
  isAvailable?: boolean;
  tenantId?: string;
};

// Service class for unit operations
export class UnitService {
  /**
   * @deprecated Use rentalService.createRental() instead
   * Create a new unit
   * @param data Unit data
   * @returns The created unit
   */
  async createUnit(data: CreateUnitDto): Promise<any> {
    console.warn('UnitService.createUnit is deprecated. Use rentalService.createRental() instead.');
    
    try {
      // Map unit data to rental data
      const rentalData: CreateRentalDto = {
        title: `Unit ${data.unitNumber}`,
        address: '', // This would need to be provided or fetched from property
        city: '', // This would need to be provided or fetched from property
        state: '', // This would need to be provided or fetched from property
        zipCode: '', // This would need to be provided or fetched from property
        propertyType: RentalType.APARTMENT, // Default type
        unitNumber: data.unitNumber,
        floorNumber: data.floorNumber,
        size: data.size,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        rent: data.rent || 0,
        deposit: data.deposit,
        availableDate: data.dateAvailable,
        isAvailable: data.isAvailable,
        amenities: data.features,
        managerId: '', // This would need to be provided
        ownerId: '', // This would need to be provided
        createdById: '', // This would need to be provided
        status: ListingStatus.ACTIVE
      };

      // Try to get property details if propertyId is provided
      if (data.propertyId) {
        try {
          // Check if there's a corresponding rental for this property
          const parentRental = await prisma.rental.findFirst({
            where: { 
              // Assuming we have some way to link old property to new rental
              // This is a simplified approach
            }
          });

          if (parentRental) {
            rentalData.address = parentRental.address;
            rentalData.city = parentRental.city;
            rentalData.state = parentRental.state;
            rentalData.zipCode = parentRental.zipCode;
            rentalData.propertyType = parentRental.propertyType;
            rentalData.managerId = parentRental.managerId;
            rentalData.ownerId = parentRental.ownerId;
            rentalData.createdById = parentRental.createdById;
          }
        } catch (error) {
          console.warn('Could not find parent rental for property:', data.propertyId);
        }
      }

      return await rentalService.createRental(rentalData);
    } catch (error) {
      // Fallback to legacy behavior if rental creation fails
      console.warn('Falling back to legacy unit creation');
      
      const formattedData = {
        ...data,
        features: data.features || undefined,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      };

      const unit = await prisma.unit.create({
        data: formattedData,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
            }
          },
          tenant: data.tenantId ? {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          } : undefined
        }
      });

      return unit;
    }
  }

  /**
   * @deprecated Use rentalService.getRentalById() instead
   * Get a unit by ID
   * @param id Unit ID
   * @returns The unit if found
   */
  async getUnitById(id: string): Promise<any | null> {
    console.warn('UnitService.getUnitById is deprecated. Use rentalService.getRentalById() instead.');
    
    try {
      // Try to find corresponding rental first
      const rental = await prisma.rental.findFirst({
        where: { 
          unitNumber: { not: null },
          // Additional logic to match unit to rental would go here
        }
      });

      if (rental) {
        return await rentalService.getRentalById(rental.id);
      }

      // Fallback to legacy unit lookup
      const unit = await prisma.unit.findUnique({
        where: { id },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              propertyType: true
            }
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          lease: true,
          maintenanceRequests: {
            where: {
              status: {
                not: 'CANCELLED'
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        }
      });

      return unit;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.getRentals() with unit filters instead
   * Get units with filtering, pagination, and sorting
   */
  async getUnits(
    filters: UnitFilterParams = {},
    page: number = 1,
    limit: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    units: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.warn('UnitService.getUnits is deprecated. Use rentalService.getRentals() with unit filters instead.');
    
    try {
      // Map unit filters to rental filters
      const rentalFilters: RentalFilterParams = {
        minBedrooms: filters.minBedrooms,
        maxBedrooms: filters.maxBedrooms,
        minBathrooms: filters.minBathrooms,
        maxBathrooms: filters.maxBathrooms,
        minRent: filters.minRent,
        maxRent: filters.maxRent,
        isAvailable: filters.isAvailable
      };

      const result = await rentalService.getRentals(
        rentalFilters,
        page,
        limit,
        sortField,
        sortOrder
      );

      // Filter for unit-type rentals
      const unitRentals = result.rentals.filter(rental => rental.unitNumber);

      return {
        units: unitRentals,
        total: unitRentals.length,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(unitRentals.length / limit)
      };
    } catch (error) {
      // Fallback to legacy behavior
      console.warn('Falling back to legacy unit retrieval');
      
      const where: any = {
        ...(filters.unitNumber && {
          unitNumber: { contains: filters.unitNumber }
        }),
        ...(filters.propertyId && {
          propertyId: filters.propertyId
        }),
        ...(filters.minBedrooms && {
          bedrooms: { gte: filters.minBedrooms }
        }),
        ...(filters.maxBedrooms && {
          bedrooms: { lte: filters.maxBedrooms }
        }),
        ...(filters.minBathrooms && {
          bathrooms: { gte: filters.minBathrooms }
        }),
        ...(filters.maxBathrooms && {
          bathrooms: { lte: filters.maxBathrooms }
        }),
        ...(filters.minRent && {
          rent: { gte: filters.minRent }
        }),
        ...(filters.maxRent && {
          rent: { lte: filters.maxRent }
        }),
        ...(filters.isAvailable !== undefined && {
          isAvailable: filters.isAvailable
        }),
        ...(filters.tenantId && {
          tenantId: filters.tenantId
        })
      };

      const { skip, take } = getPaginationParams(page, limit);
      const orderBy = buildSortParams(sortField, sortOrder);

      const [total, units] = await Promise.all([
        prisma.unit.count({ where }),
        prisma.unit.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true
              }
            },
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            lease: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                status: true
              }
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        units,
        total,
        page,
        limit,
        totalPages
      };
    }
  }

  /**
   * @deprecated Use rentalService.getRentals() with property filter instead
   * Get units by property ID
   */
  async getUnitsByPropertyId(propertyId: string, includeUnavailable: boolean = false): Promise<any[]> {
    console.warn('UnitService.getUnitsByPropertyId is deprecated. Use rentalService.getRentals() with property filter instead.');
    
    try {
      // Try to find rentals that correspond to this property
      const filters: RentalFilterParams = {
        isAvailable: includeUnavailable ? undefined : true
      };

      const result = await rentalService.getRentals(filters);
      return result.rentals.filter(rental => rental.unitNumber);
    } catch (error) {
      // Fallback to legacy behavior
      const where: any = {
        propertyId
      };

      if (!includeUnavailable) {
        where.isAvailable = true;
      }

      const units = await prisma.unit.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true
            }
          }
        },
        orderBy: {
          unitNumber: 'asc'
        }
      });

      return units;
    }
  }

  /**
   * @deprecated Use rentalService.updateRental() instead
   * Update a unit
   */
  async updateUnit(id: string, data: UpdateUnitDto): Promise<any> {
    console.warn('UnitService.updateUnit is deprecated. Use rentalService.updateRental() instead.');
    
    try {
      // Try to find corresponding rental
      const rental = await prisma.rental.findFirst({
        where: { 
          // Logic to match unit to rental
        }
      });

      if (rental) {
        const rentalUpdateData: UpdateRentalDto = {
          unitNumber: data.unitNumber,
          floorNumber: data.floorNumber,
          size: data.size,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          rent: data.rent,
          deposit: data.deposit,
          availableDate: data.dateAvailable,
          isAvailable: data.isAvailable,
          amenities: data.features
        };

        return await rentalService.updateRental(rental.id, rentalUpdateData);
      }

      // Fallback to legacy behavior
      const formattedData = {
        ...data,
        features: data.features || undefined
      };

      const unit = await prisma.unit.update({
        where: { id },
        data: formattedData,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true
            }
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          lease: true
        }
      });

      return unit;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.setRentalAvailability() instead
   * Set unit availability
   */
  async setUnitAvailability(id: string, isAvailable: boolean, dateAvailable?: Date): Promise<any> {
    console.warn('UnitService.setUnitAvailability is deprecated. Use rentalService.setRentalAvailability() instead.');
    
    try {
      // Try to find corresponding rental
      const rental = await prisma.rental.findFirst({
        where: { 
          // Logic to match unit to rental
        }
      });

      if (rental) {
        return await rentalService.setRentalAvailability(rental.id, isAvailable, dateAvailable);
      }

      // Fallback to legacy behavior
      const updateData: any = { isAvailable };
      
      if (isAvailable && dateAvailable) {
        updateData.dateAvailable = dateAvailable;
      }

      const unit = await prisma.unit.update({
        where: { id },
        data: updateData
      });

      return unit;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.assignTenant() instead
   * Assign tenant to unit
   */
  async assignTenant(id: string, tenantId: string): Promise<any> {
    console.warn('UnitService.assignTenant is deprecated. Use rentalService.assignTenant() instead.');
    
    try {
      const updateData: any = { isAvailable: false };

      const unit = await prisma.unit.update({
        where: { id },
        data: updateData,
        include: {
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return unit;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.removeTenant() instead
   * Remove tenant from unit
   */
  async removeTenant(id: string): Promise<any> {
    console.warn('UnitService.removeTenant is deprecated. Use rentalService.removeTenant() instead.');
    
    try {
      // Check if there's an active lease
      const currentUnit = await prisma.unit.findUnique({
        where: { id },
        include: {
          lease: true
        }
      });

      if (currentUnit?.lease) {
        throw {
          message: 'Cannot remove tenant with an active lease',
          code: 'ACTIVE_LEASE_EXISTS',
          status: 400
        };
      }

      const unit = await prisma.unit.update({
        where: { id },
        data: { 
          tenantId: null,
          isAvailable: true
        }
      });

      return unit;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.deleteRental() instead
   * Delete a unit
   */
  async deleteUnit(id: string): Promise<boolean> {
    console.warn('UnitService.deleteUnit is deprecated. Use rentalService.deleteRental() instead.');
    
    try {
      // Try to find corresponding rental
      const rental = await prisma.rental.findFirst({
        where: { 
          // Logic to match unit to rental
        }
      });

      if (rental) {
        return await rentalService.deleteRental(rental.id);
      }

      // Fallback to legacy behavior
      const unit = await prisma.unit.findUnique({
        where: { id },
        include: {
          lease: true,
          maintenanceRequests: {
            where: {
              status: {
                not: 'COMPLETED'
              }
            }
          }
        }
      });

      if (unit?.lease) {
        throw {
          message: 'Cannot delete unit with an active lease',
          code: 'ACTIVE_LEASE_EXISTS',
          status: 400
        };
      }

      if (unit?.maintenanceRequests && unit.maintenanceRequests.length > 0) {
        throw {
          message: 'Cannot delete unit with active maintenance requests',
          code: 'ACTIVE_MAINTENANCE_EXISTS',
          status: 400
        };
      }

      await prisma.unit.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.getVacantRentalsCount() instead
   * Get vacant units count for a property
   */
  async getVacantUnitsCount(propertyId: string): Promise<number> {
    console.warn('UnitService.getVacantUnitsCount is deprecated. Use rentalService.getVacantRentalsCount() instead.');
    
    try {
      const count = await prisma.unit.count({
        where: {
          propertyId,
          isAvailable: true
        }
      });

      return count;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * @deprecated Use rentalService.getOccupancyRate() instead
   * Get occupancy rate for a property
   */
  async getOccupancyRate(propertyId: string): Promise<number> {
    console.warn('UnitService.getOccupancyRate is deprecated. Use rentalService.getOccupancyRate() instead.');
    
    try {
      const totalUnits = await prisma.unit.count({
        where: { propertyId }
      });

      if (totalUnits === 0) {
        return 0;
      }

      const occupiedUnits = await prisma.unit.count({
        where: {
          propertyId,
          isAvailable: false
        }
      });

      return occupiedUnits / totalUnits;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
}

// Export a singleton instance
export const unitService = new UnitService();