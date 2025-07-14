import { prisma } from '../config/database';
import { handleDatabaseError, getPaginationParams, buildSortParams } from '../utils/dbUtils';

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
   * Create a new unit
   * @param data Unit data
   * @returns The created unit
   */
  async createUnit(data: CreateUnitDto): Promise<any> {
    try {
      // Format features as JSON if provided
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
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get a unit by ID
   * @param id Unit ID
   * @returns The unit if found
   */
  async getUnitById(id: string): Promise<any | null> {
    try {
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
   * Get units with filtering, pagination, and sorting
   * @param filters Filter parameters
   * @param page Page number (1-based)
   * @param limit Number of items per page
   * @param sortField Field to sort by
   * @param sortOrder Sort direction ('asc' or 'desc')
   * @returns Paginated units
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
    try {
      // Build where clause from filters
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

      // Get pagination params
      const { skip, take } = getPaginationParams(page, limit);

      // Get sort params
      const orderBy = buildSortParams(sortField, sortOrder);

      // Execute count and findMany in parallel
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
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get units by property ID
   * @param propertyId Property ID
   * @param includeUnavailable Whether to include unavailable units
   * @returns List of units for the property
   */
  async getUnitsByPropertyId(propertyId: string, includeUnavailable: boolean = false): Promise<any[]> {
    try {
      const where: any = {
        propertyId
      };

      // Only include available units if specified
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
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Update a unit
   * @param id Unit ID
   * @param data Update data
   * @returns The updated unit
   */
  async updateUnit(id: string, data: UpdateUnitDto): Promise<any> {
    try {
      // Format features as JSON if provided
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
   * Set unit availability
   * @param id Unit ID
   * @param isAvailable Availability status
   * @param dateAvailable Date when unit becomes available (if setting to available)
   * @returns The updated unit
   */
  async setUnitAvailability(id: string, isAvailable: boolean, dateAvailable?: Date): Promise<any> {
    try {
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
   * Assign tenant to unit
   * @param id Unit ID
   * @param tenantId Tenant ID
   * @returns The updated unit
   */
  async assignTenant(id: string, tenantId: string): Promise<any> {
    try {
      const unit = await prisma.unit.update({
        where: { id },
        data: { 
          tenantId,
          isAvailable: false
        },
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
   * Remove tenant from unit
   * @param id Unit ID
   * @returns The updated unit
   */
  async removeTenant(id: string): Promise<any> {
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
   * Delete a unit
   * @param id Unit ID
   * @returns True if successful
   */
  async deleteUnit(id: string): Promise<boolean> {
    try {
      // Check if unit has active lease or maintenance requests
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

      // Delete the unit
      await prisma.unit.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get vacant units count for a property
   * @param propertyId Property ID
   * @returns Number of vacant units
   */
  async getVacantUnitsCount(propertyId: string): Promise<number> {
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
   * Get occupancy rate for a property
   * @param propertyId Property ID
   * @returns Occupancy rate as a decimal (0-1)
   */
  async getOccupancyRate(propertyId: string): Promise<number> {
    try {
      // Get total units for property
      const totalUnits = await prisma.unit.count({
        where: { propertyId }
      });

      if (totalUnits === 0) {
        return 0;
      }

      // Get occupied units
      const occupiedUnits = await prisma.unit.count({
        where: {
          propertyId,
          isAvailable: false
        }
      });

      // Calculate occupancy rate
      return occupiedUnits / totalUnits;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
}

// Export a singleton instance
export const unitService = new UnitService(); 