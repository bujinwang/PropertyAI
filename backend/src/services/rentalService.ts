import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { handleDatabaseError, getPaginationParams, buildSortParams } from '../utils/dbUtils';

// Enum for rental types matching Prisma schema
export enum RentalType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  OTHER = 'OTHER'
}

// Enum for listing status
export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED'
}

// Rental interface based on Prisma schema
export interface Rental {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: RentalType;
  yearBuilt: number | null;
  totalUnits: number;
  amenities: any | null;
  unitNumber: string | null;
  floorNumber: number | null;
  size: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rent: number;
  deposit: number | null;
  availableDate: Date | null;
  isAvailable: boolean;
  leaseTerms: string | null;
  slug: string;
  viewCount: number;
  isActive: boolean;
  status: ListingStatus;
  managerId: string;
  ownerId: string;
  createdById: string;
  whiteLabelConfigId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Type for creating a new rental
export type CreateRentalDto = {
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  propertyType: RentalType;
  yearBuilt?: number;
  totalUnits?: number;
  amenities?: Record<string, any>;
  unitNumber?: string;
  floorNumber?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent: number;
  deposit?: number;
  availableDate?: Date;
  isAvailable?: boolean;
  leaseTerms?: string;
  slug?: string;
  isActive?: boolean;
  status?: ListingStatus;
  managerId: string;
  ownerId: string;
  createdById: string;
  whiteLabelConfigId?: string;
};

// Type for updating a rental
export type UpdateRentalDto = Partial<CreateRentalDto>;

// Rental filter parameters
export type RentalFilterParams = {
  title?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: RentalType;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minRent?: number;
  maxRent?: number;
  minSize?: number;
  maxSize?: number;
  isAvailable?: boolean;
  status?: ListingStatus;
  managerId?: string;
  ownerId?: string;
  isActive?: boolean;
};

// Service class for rental operations
export class RentalService {
  /**
   * Create a new rental
   * @param data Rental data
   * @returns The created rental
   */
  async createRental(data: CreateRentalDto): Promise<any> {
    try {
      // Format JSON fields
      const formattedData = {
        ...data,
        amenities: data.amenities || undefined,
        country: data.country || 'USA',
        totalUnits: data.totalUnits || 1,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        isActive: data.isActive !== undefined ? data.isActive : true,
        status: data.status || ListingStatus.ACTIVE,
        slug: data.slug || this.generateSlug(data.title, data.address)
      };

      const rental = await prisma.rental.create({
        data: formattedData,
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
          RentalImages: true,
          Documents: true,
          MaintenanceRequests: true,
          Leases: true,
          Applications: true
        }
      });

      return rental;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get a rental by ID
   * @param id Rental ID
   * @returns The rental if found
   */
  async getRentalById(id: string): Promise<any | null> {
    try {
      const rental = await prisma.rental.findUnique({
        where: { id },
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
          RentalImages: true,
          Documents: true,
          MaintenanceRequests: {
            where: {
              status: {
                not: 'CANCELLED'
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          },
          Leases: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          Applications: {
            where: {
              status: {
                not: 'REJECTED'
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        }
      });

      return rental;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get rentals with filtering, pagination, and sorting
   * @param filters Filter parameters
   * @param page Page number (1-based)
   * @param limit Number of items per page
   * @param sortField Field to sort by
   * @param sortOrder Sort direction ('asc' or 'desc')
   * @returns Paginated rentals
   */
  async getRentals(
    filters: RentalFilterParams = {},
    page: number = 1,
    limit: number = 10,
    sortField: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    rentals: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Build where clause from filters
      const where: any = {
        ...(filters.title && {
          title: { contains: filters.title, mode: 'insensitive' }
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
        ...(filters.minSize && {
          size: { gte: filters.minSize }
        }),
        ...(filters.maxSize && {
          size: { lte: filters.maxSize }
        }),
        ...(filters.isAvailable !== undefined && {
          isAvailable: filters.isAvailable
        }),
        ...(filters.status && {
          status: filters.status
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
      const [total, rentals] = await Promise.all([
        prisma.rental.count({ where }),
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

      const totalPages = Math.ceil(total / limit);

      return {
        rentals,
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
   * Get rentals by manager ID
   * @param managerId Manager ID
   * @param includeInactive Whether to include inactive rentals
   * @returns List of rentals for the manager
   */
  async getRentalsByManagerId(managerId: string, includeInactive: boolean = false): Promise<any[]> {
    try {
      const where: any = {
        managerId
      };

      if (!includeInactive) {
        where.isActive = true;
      }

      const rentals = await prisma.rental.findMany({
        where,
        include: {
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return rentals;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get rentals by owner ID
   * @param ownerId Owner ID
   * @param includeInactive Whether to include inactive rentals
   * @returns List of rentals for the owner
   */
  async getRentalsByOwnerId(ownerId: string, includeInactive: boolean = false): Promise<any[]> {
    try {
      const where: any = {
        ownerId
      };

      if (!includeInactive) {
        where.isActive = true;
      }

      const rentals = await prisma.rental.findMany({
        where,
        include: {
          Manager: {
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return rentals;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Update a rental
   * @param id Rental ID
   * @param data Update data
   * @returns The updated rental
   */
  async updateRental(id: string, data: UpdateRentalDto): Promise<any> {
    try {
      // Format JSON fields
      const formattedData = {
        ...data,
        amenities: data.amenities || undefined
      };

      const rental = await prisma.rental.update({
        where: { id },
        data: formattedData,
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
          },
          Documents: true,
          Leases: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return rental;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Set rental availability
   * @param id Rental ID
   * @param isAvailable Availability status
   * @param availableDate Date when rental becomes available (if setting to available)
   * @returns The updated rental
   */
  async setRentalAvailability(id: string, isAvailable: boolean, availableDate?: Date): Promise<any> {
    try {
      const updateData: any = { isAvailable };
      
      if (isAvailable && availableDate) {
        updateData.availableDate = availableDate;
      }

      const rental = await prisma.rental.update({
        where: { id },
        data: updateData
      });

      return rental;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Set rental status
   * @param id Rental ID
   * @param status New status
   * @returns The updated rental
   */
  async setRentalStatus(id: string, status: ListingStatus): Promise<any> {
    try {
      const rental = await prisma.rental.update({
        where: { id },
        data: { status }
      });

      return rental;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Set rental active status
   * @param id Rental ID
   * @param isActive Active status
   * @returns The updated rental
   */
  async setRentalActiveStatus(id: string, isActive: boolean): Promise<any> {
    try {
      const rental = await prisma.rental.update({
        where: { id },
        data: { isActive }
      });

      return rental;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Delete a rental
   * @param id Rental ID
   * @returns True if successful
   */
  async deleteRental(id: string): Promise<boolean> {
    try {
      // Check if rental has active lease or applications
      const rental = await prisma.rental.findUnique({
        where: { id },
        include: {
          Leases: {
            where: {
              status: 'ACTIVE'
            }
          },
          Applications: {
            where: {
              status: {
                in: ['PENDING', 'APPROVED']
              }
            }
          }
        }
      });

      if (rental?.Leases && rental.Leases.length > 0) {
        throw {
          message: 'Cannot delete rental with an active lease',
          code: 'ACTIVE_LEASE_EXISTS',
          status: 400
        };
      }

      if (rental?.Applications && rental.Applications.length > 0) {
        throw {
          message: 'Cannot delete rental with pending applications',
          code: 'PENDING_APPLICATIONS_EXIST',
          status: 400
        };
      }

      // Delete related data first
      await prisma.document.deleteMany({
        where: { rentalId: id }
      });

      await prisma.maintenanceRequest.deleteMany({
        where: { rentalId: id }
      });

      await prisma.lease.deleteMany({
        where: { rentalId: id }
      });

      await prisma.application.deleteMany({
        where: { rentalId: id }
      });

      await prisma.rentalImage.deleteMany({
        where: { rentalId: id }
      });

      // Delete the rental
      await prisma.rental.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Count rentals by type
   * @returns Count of rentals by type
   */
  async countRentalsByType(): Promise<Record<string, number>> {
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
      Object.values(RentalType).forEach((type) => {
        if (result[type] === undefined) {
          result[type] = 0;
        }
      });

      return result;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get rental statistics
   * @param managerId Optional manager ID to filter
   * @param ownerId Optional owner ID to filter
   * @returns Rental statistics
   */
  async getRentalStats(managerId?: string, ownerId?: string): Promise<{
    totalRentals: number;
    availableRentals: number;
    rentedRentals: number;
    occupancyRate: number;
    averageRent: number;
  }> {
    try {
      const where: any = {};
      
      if (managerId) {
        where.managerId = managerId;
      }
      
      if (ownerId) {
        where.ownerId = ownerId;
      }

      const [
        totalRentals,
        availableRentals,
        rentedRentals,
        averageRent
      ] = await Promise.all([
        prisma.rental.count({ where }),
        prisma.rental.count({ 
          where: { ...where, isAvailable: true } 
        }),
        prisma.rental.count({ 
          where: { ...where, isAvailable: false } 
        }),
        prisma.rental.aggregate({
          where,
          _avg: {
            rent: true
          }
        })
      ]);

      const occupancyRate = totalRentals > 0 ? rentedRentals / totalRentals : 0;

      return {
        totalRentals,
        availableRentals,
        rentedRentals,
        occupancyRate,
        averageRent: averageRent._avg.rent || 0
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Generate a unique slug for the rental
   * @param title Rental title
   * @param address Rental address
   * @returns Generated slug
   */
  private generateSlug(title: string, address: string): string {
    const baseSlug = `${title}-${address}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    return `${baseSlug}-${Date.now()}`;
  }

  /**
   * Build where clause from filters
   * @param filters Filter parameters
   * @returns Prisma where clause
   */
  private buildWhereClause(filters: RentalFilterParams): any {
    return {
      ...(filters.title && {
        title: { contains: filters.title, mode: 'insensitive' }
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
      ...(filters.minSize && {
        size: { gte: filters.minSize }
      }),
      ...(filters.maxSize && {
        size: { lte: filters.maxSize }
      }),
      ...(filters.isAvailable !== undefined && {
        isAvailable: filters.isAvailable
      }),
      ...(filters.status && {
        status: filters.status
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
  }

  /**
   * Search rentals with text-based search
   * @param searchTerm Search term
   * @param filters Additional filters
   * @param page Page number
   * @param limit Items per page
   * @returns Search results
   */
  async searchRentals(
    searchTerm: string,
    filters: RentalFilterParams = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{
    rentals: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const where: any = {
        ...this.buildWhereClause(filters),
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { address: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
          { state: { contains: searchTerm, mode: 'insensitive' } },
          { zipCode: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };

      const [rentals, total] = await Promise.all([
        prisma.rental.findMany({
          where,
          include: {
            RentalImages: true,
            Manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            Owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.rental.count({ where })
      ]);

      return {
        rentals,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Bulk create rentals
   * @param rentals Array of rental data
   * @returns Created rentals with success/failure tracking
   */
  async bulkCreateRentals(rentals: CreateRentalDto[]): Promise<{
    successful: any[];
    failed: Array<{ data: CreateRentalDto; error: string }>;
  }> {
    try {
      const successful = [];
      const failed = [];
      
      for (const rentalData of rentals) {
        try {
          const rental = await this.createRental(rentalData);
          successful.push(rental);
        } catch (error: any) {
          failed.push({
            data: rentalData,
            error: error.message || 'Failed to create rental'
          });
        }
      }

      return { successful, failed };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Bulk update rentals
   * @param updates Array of update objects with id and data
   * @returns Updated rentals with success/failure tracking
   */
  async bulkUpdateRentals(updates: { id: string; data: UpdateRentalDto }[]): Promise<{
    successful: any[];
    failed: Array<{ id: string; data: UpdateRentalDto; error: string }>;
  }> {
    try {
      const successful = [];
      const failed = [];
      
      for (const update of updates) {
        try {
          const rental = await this.updateRental(update.id, update.data);
          successful.push(rental);
        } catch (error: any) {
          failed.push({
            id: update.id,
            data: update.data,
            error: error.message || 'Failed to update rental'
          });
        }
      }

      return { successful, failed };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Bulk delete rentals
   * @param ids Array of rental IDs
   * @returns Success status with detailed results
   */
  async bulkDeleteRentals(ids: string[]): Promise<{
    success: boolean;
    deletedCount: number;
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    try {
      const successful = [];
      const failed = [];
      
      for (const id of ids) {
        try {
          const success = await this.deleteRental(id);
          if (success) {
            successful.push(id);
          } else {
            failed.push({
              id,
              error: 'Failed to delete rental'
            });
          }
        } catch (error: any) {
          failed.push({
            id,
            error: error.message || 'Failed to delete rental'
          });
        }
      }

      return {
        success: true,
        deletedCount: successful.length,
        successful,
        failed
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get rental analytics
   * @param filters Analytics filters
   * @returns Analytics data
   */
  async getRentalAnalytics(filters: {
    managerId?: string;
    ownerId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    totalRentals: number;
    availableRentals: number;
    rentedRentals: number;
    occupancyRate: number;
    averageRent: number;
    totalRevenue: number;
    rentalsByType: Record<string, number>;
    rentalsByStatus: Record<string, number>;
    monthlyTrends: Array<{
      month: string;
      rentals: number;
      revenue: number;
    }>;
  }> {
    try {
      const where: any = {};
      
      if (filters.managerId) {
        where.managerId = filters.managerId;
      }
      
      if (filters.ownerId) {
        where.ownerId = filters.ownerId;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const [
        totalRentals,
        availableRentals,
        rentedRentals,
        averageRent,
        totalRevenue,
        rentalsByType,
        rentalsByStatus
      ] = await Promise.all([
        prisma.rental.count({ where }),
        prisma.rental.count({ 
          where: { ...where, isAvailable: true } 
        }),
        prisma.rental.count({ 
          where: { ...where, isAvailable: false } 
        }),
        prisma.rental.aggregate({
          where,
          _avg: { rent: true }
        }),
        prisma.rental.aggregate({
          where,
          _sum: { rent: true }
        }),
        prisma.rental.groupBy({
          by: ['propertyType'],
          where,
          _count: { id: true }
        }),
        prisma.rental.groupBy({
          by: ['status'],
          where,
          _count: { id: true }
        })
      ]);

      const occupancyRate = totalRentals > 0 ? rentedRentals / totalRentals : 0;

      // Convert grouped results to records
      const rentalsByTypeRecord: Record<string, number> = {};
      rentalsByType.forEach((item: any) => {
        if (item.propertyType) {
          rentalsByTypeRecord[item.propertyType] = item._count.id;
        }
      });

      const rentalsByStatusRecord: Record<string, number> = {};
      rentalsByStatus.forEach((item: any) => {
        if (item.status) {
          rentalsByStatusRecord[item.status] = item._count.id;
        }
      });

      // Get monthly trends (last 12 months)
      const monthlyTrends = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthWhere = {
          ...where,
          createdAt: {
            gte: date,
            lt: nextDate
          }
        };

        const [monthRentals, monthRevenue] = await Promise.all([
          prisma.rental.count({ where: monthWhere }),
          prisma.rental.aggregate({
            where: monthWhere,
            _sum: { rent: true }
          })
        ]);

        monthlyTrends.push({
          month: date.toISOString().substring(0, 7), // YYYY-MM format
          rentals: monthRentals,
          revenue: monthRevenue._sum.rent || 0
        });
      }

      return {
        totalRentals,
        availableRentals,
        rentedRentals,
        occupancyRate,
        averageRent: averageRent._avg.rent || 0,
        totalRevenue: totalRevenue._sum.rent || 0,
        rentalsByType: rentalsByTypeRecord,
        rentalsByStatus: rentalsByStatusRecord,
        monthlyTrends
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
}

// Export a singleton instance
export const rentalService = new RentalService();