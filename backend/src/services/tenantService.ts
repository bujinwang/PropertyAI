// backend/src/services/tenantService.ts

import { PrismaClient, User, UserRole } from '@prisma/client';

// Define interfaces for tenant-related data transfer objects (DTOs)
// These would typically be defined in a shared types directory, e.g., backend/src/types/
interface CreateTenantDto {
  email: string;
  password?: string; // Tenants are Users, so they need a password
  firstName: string;
  lastName: string;
  phone?: string;
  rentalId?: string; // Link to a rental (changed from unitId)
  // Add other relevant fields for creating a tenant (User)
}

interface UpdateTenantDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean; // User status
  rentalId?: string; // Update associated rental (changed from unitId)
  // Add other fields that can be updated for a tenant (User)
}

export class TenantService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Creates a new tenant (User with role TENANT) record.
   * @param data - The data for the new tenant.
   * @returns The created tenant (User) object.
   */
  async createTenant(data: CreateTenantDto): Promise<User> {
    try {
      // Ensure a password is provided for new users
      if (!data.password) {
        throw new Error('Password is required for new tenant creation.');
      }

      const tenant = await this.prisma.user.create({
        data: {
          email: data.email,
          password: data.password, // In a real app, this would be hashed
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: UserRole.TENANT,
          // Note: The relationship to rental would need to be handled through Lease model
          // as tenants are connected to rentals through leases, not directly
          // Map other fields as necessary
        },
      });
      return tenant;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw new Error('Failed to create tenant.');
    }
  }

  /**
   * Retrieves a tenant (User with role TENANT) by their ID.
   * @param id - The unique ID of the tenant.
   * @returns The tenant (User) object, or null if not found or not a tenant.
   */
  async getTenantById(id: string): Promise<User | null> {
    try {
      const tenant = await this.prisma.user.findUnique({
        where: { id, role: UserRole.TENANT },
      });
      return tenant;
    } catch (error) {
      console.error(`Error fetching tenant with ID ${id}:`, error);
      throw new Error('Failed to retrieve tenant.');
    }
  }

  /**
   * Retrieves all tenants (Users with role TENANT), optionally filtered by rental ID.
   * @param rentalId - Optional rental ID to filter tenants.
   * @returns An array of tenant (User) objects.
   */
  async getAllTenants(rentalId?: string): Promise<User[]> {
    try {
      const whereClause: any = { role: UserRole.TENANT };

      if (rentalId) {
        // Filter tenants by rental through active leases
        whereClause.Lease = {
          some: {
            rentalId: rentalId,
            status: 'ACTIVE' // Only active leases
          },
        };
      }

      const tenants = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          Lease: {
            where: {
              status: 'ACTIVE'
            },
            include: {
              Rental: {
                select: {
                  id: true,
                  title: true,
                  unitNumber: true,
                  address: true,
                },
              },
            },
          },
        },
      });
      return tenants;
    } catch (error) {
      console.error('Error fetching all tenants:', error);
      throw new Error('Failed to retrieve tenants.');
    }
  }

  /**
   * Updates an existing tenant (User with role TENANT) record.
   * @param id - The ID of the tenant to update.
   * @param data - The data to update the tenant with.
   * @returns The updated tenant (User) object.
   */
  async updateTenant(id: string, data: UpdateTenantDto): Promise<User> {
    try {
      const updateData: any = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        isActive: data.isActive,
      };

      // Note: Rental association is handled through Lease model
      // If you need to change a tenant's rental, you would need to:
      // 1. End the current lease
      // 2. Create a new lease for the new rental
      // This is more complex than a simple update and should be handled separately

      const updatedTenant = await this.prisma.user.update({
        where: { id, role: UserRole.TENANT },
        data: updateData,
      });
      return updatedTenant;
    } catch (error) {
      console.error(`Error updating tenant with ID ${id}:`, error);
      throw new Error('Failed to update tenant.');
    }
  }

  /**
   * Deletes a tenant (User with role TENANT) record by their ID.
   * @param id - The ID of the tenant to delete.
   * @returns The deleted tenant (User) object.
   */
  async deleteTenant(id: string): Promise<User> {
    try {
      // Ensure the user is a tenant before deleting as a tenant
      const tenantToDelete = await this.prisma.user.findUnique({
        where: { id, role: UserRole.TENANT },
      });

      if (!tenantToDelete) {
        throw new Error('Tenant not found or user is not a tenant.');
      }

      const deletedTenant = await this.prisma.user.delete({
        where: { id },
      });
      return deletedTenant;
    } catch (error) {
      console.error(`Error deleting tenant with ID ${id}:`, error);
      throw new Error('Failed to delete tenant.');
    }
  }
}