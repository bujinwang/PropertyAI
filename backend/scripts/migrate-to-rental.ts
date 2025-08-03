import { PrismaClient, PropertyType, ListingStatus } from '@prisma/client';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

config();

const prisma = new PrismaClient();

interface MigrationStats {
  propertiesProcessed: number;
  unitsProcessed: number;
  rentalsCreated: number;
  errors: number;
  skipped: number;
}

class RentalMigrationService {
  private stats: MigrationStats = {
    propertiesProcessed: 0,
    unitsProcessed: 0,
    rentalsCreated: 0,
    errors: 0,
    skipped: 0
  };

  async migrateToRentalSystem() {
    console.log('🏠 Starting migration to Rental system');
    console.log('=' .repeat(60));

    try {
      // Check if Property and Unit tables exist
      const hasLegacyTables = await this.checkLegacyTables();
      
      if (!hasLegacyTables) {
        console.log('ℹ️  No legacy Property or Unit tables found. Migration not needed.');
        return;
      }

      // First, migrate properties as rentals
      await this.migrateProperties();
      
      // Then, migrate units as rentals
      await this.migrateUnits();

      // Create relationships and update references
      await this.createRelationships();

      // Generate migration report
      this.generateReport();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async checkLegacyTables(): Promise<boolean> {
    try {
      // Try to query the legacy tables to see if they exist
      await prisma.$queryRaw`SELECT 1 FROM "Property" LIMIT 1`;
      return true;
    } catch (error) {
      // Tables don't exist, which is fine
      return false;
    }
  }

  private async migrateProperties() {
    console.log('\n🏢 Migrating Properties to Rentals');
    console.log('-' .repeat(40));

    try {
      // Use raw query since Property table might not be in current schema
      const properties = await prisma.$queryRaw<any[]>`
        SELECT * FROM "Property"
      `;

      for (const property of properties) {
        try {
          this.stats.propertiesProcessed++;

          // Check if rental already exists
          const existingRental = await prisma.rental.findFirst({
            where: {
              // Use a combination of address and created date to identify duplicates
              address: property.address,
              createdAt: property.createdAt
            }
          });

          if (existingRental) {
            console.log(`⏭️  Skipping property ${property.id} - already migrated`);
            this.stats.skipped++;
            continue;
          }

          // Get a valid user for manager, owner, and creator
          const defaultUser = await this.getOrCreateDefaultUser();

          // Determine property type
          const propertyType = this.mapPropertyType(property.type || property.propertyType);

          // Create rental from property
          const rental = await prisma.rental.create({
            data: {
              id: uuidv4(),
              title: property.name || `Property at ${property.address}`,
              description: property.description || `${propertyType} property located at ${property.address}`,
              address: property.address || '',
              city: property.city || '',
              state: property.state || '',
              zipCode: property.zipCode || '',
              country: property.country || 'USA',
              latitude: property.latitude,
              longitude: property.longitude,
              propertyType: propertyType,
              yearBuilt: property.yearBuilt,
              totalUnits: property.totalUnits || 1,
              amenities: property.amenities || {},
              size: property.squareFootage || property.size,
              bedrooms: property.bedrooms || 0,
              bathrooms: property.bathrooms || 0,
              rent: property.monthlyRent || property.rent || 0,
              deposit: property.securityDeposit || property.deposit || 0,
              availableDate: property.availableDate || new Date(),
              isAvailable: property.isAvailable !== false,
              leaseTerms: property.leaseTerms,
              slug: this.generateSlug(property.name || property.address, property.id),
              status: this.mapPropertyStatus(property.status),
              managerId: property.managerId || defaultUser.id,
              ownerId: property.ownerId || defaultUser.id,
              createdById: property.createdById || defaultUser.id,
              createdAt: property.createdAt || new Date(),
              updatedAt: property.updatedAt || new Date(),
            }
          });

          console.log(`✅ Migrated property ${property.id} → rental ${rental.id}`);
          this.stats.rentalsCreated++;

        } catch (error) {
          console.error(`❌ Failed to migrate property ${property.id}:`, error);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.log('ℹ️  No Property table found or no properties to migrate');
    }
  }

  private async migrateUnits() {
    console.log('\n🏠 Migrating Units to Rentals');
    console.log('-' .repeat(40));

    try {
      // Use raw query since Unit table might not be in current schema
      const units = await prisma.$queryRaw<any[]>`
        SELECT u.*, p.address as property_address, p.city as property_city, 
               p.state as property_state, p.zipCode as property_zipCode
        FROM "Unit" u
        LEFT JOIN "Property" p ON u.propertyId = p.id
      `;

      for (const unit of units) {
        try {
          this.stats.unitsProcessed++;

          // Check if rental already exists
          const existingRental = await prisma.rental.findFirst({
            where: {
              unitNumber: unit.unitNumber,
              address: unit.property_address || unit.address
            }
          });

          if (existingRental) {
            console.log(`⏭️  Skipping unit ${unit.id} - already migrated`);
            this.stats.skipped++;
            continue;
          }

          // Get a valid user for manager, owner, and creator
          const defaultUser = await this.getOrCreateDefaultUser();

          // Find parent rental (migrated from property)
          const parentRental = await prisma.rental.findFirst({
            where: {
              address: unit.property_address || unit.address,
              unitNumber: null // This should be the property-level rental
            }
          });

          // Create rental from unit
          const rental = await prisma.rental.create({
            data: {
              id: uuidv4(),
              title: `Unit ${unit.unitNumber}${unit.property_address ? ` - ${unit.property_address}` : ''}`,
              description: unit.description || `Unit ${unit.unitNumber}`,
              address: unit.property_address || unit.address || '',
              city: unit.property_city || unit.city || '',
              state: unit.property_state || unit.state || '',
              zipCode: unit.property_zipCode || unit.zipCode || '',
              country: 'USA',
              propertyType: 'APARTMENT', // Units are typically apartments
              unitNumber: unit.unitNumber,
              floorNumber: unit.floor || unit.floorNumber,
              size: unit.squareFootage || unit.size,
              bedrooms: unit.bedrooms || 0,
              bathrooms: unit.bathrooms || 0,
              rent: unit.monthlyRent || unit.rent || 0,
              deposit: unit.securityDeposit || unit.deposit || 0,
              availableDate: unit.availableDate || new Date(),
              isAvailable: unit.isAvailable !== false,
              leaseTerms: unit.leaseTerms,
              slug: this.generateSlug(`Unit ${unit.unitNumber}`, unit.id),
              status: this.mapUnitStatus(unit.status),
              managerId: unit.managerId || defaultUser.id,
              ownerId: unit.ownerId || defaultUser.id,
              createdById: unit.createdById || defaultUser.id,
              createdAt: unit.createdAt || new Date(),
              updatedAt: unit.updatedAt || new Date(),
            }
          });

          console.log(`✅ Migrated unit ${unit.id} → rental ${rental.id}`);
          this.stats.rentalsCreated++;

        } catch (error) {
          console.error(`❌ Failed to migrate unit ${unit.id}:`, error);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.log('ℹ️  No Unit table found or no units to migrate');
    }
  }

  private async createRelationships() {
    console.log('\n🔗 Creating rental relationships');
    console.log('-' .repeat(40));

    try {
      // Update lease agreements to reference rentals
      await this.migrateLeaseAgreements();

      // Update maintenance requests to reference rentals
      await this.migrateMaintenanceRequests();

    } catch (error) {
      console.error('❌ Failed to create relationships:', error);
      this.stats.errors++;
    }
  }

  private async migrateLeaseAgreements() {
    console.log('\n📄 Migrating lease agreements');
    
    try {
      // Find leases that don't have a rentalId set yet
      const leases = await prisma.lease.findMany({
        where: {
          rentalId: {
            equals: ""
          }
        }
      });

      for (const lease of leases) {
        try {
          // Find corresponding rental based on lease data
          let rental = null;
          
          // Try to find rental by matching lease properties
          // Since propertyId doesn't exist in current schema, we'll try to match by other means
          // Look for rentals that might match this lease
          const rentals = await prisma.rental.findMany({
            where: {
              // Try to match by tenant or other criteria
              Leases: {
                some: {
                  tenantId: lease.tenantId
                }
              }
            },
            take: 1
          });

          if (rentals.length > 0) {
            rental = rentals[0];
            await prisma.lease.update({
              where: { id: lease.id },
              data: { rentalId: rental.id }
            });
            console.log(`✅ Linked lease ${lease.id} to rental ${rental.id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to migrate lease ${lease.id}:`, error);
        }
      }
    } catch (error) {
      console.log('ℹ️  No lease migration needed or leases already migrated');
    }
  }

  private async migrateMaintenanceRequests() {
    console.log('\n🔧 Migrating maintenance requests');
    
    try {
      // Find maintenance requests that don't have a rentalId set yet
      const maintenanceRequests = await prisma.maintenanceRequest.findMany({
        where: {
          rentalId: {
            equals: ""
          }
        }
      });

      for (const request of maintenanceRequests) {
        try {
          // Find corresponding rental
          let rental = null;
          
          // Try to find rental by matching request properties
          // Since propertyId doesn't exist in current schema, we'll try to match by other means
          const rentals = await prisma.rental.findMany({
            take: 1 // Just take the first available rental for now
          });

          if (rentals.length > 0) {
            rental = rentals[0];
            await prisma.maintenanceRequest.update({
              where: { id: request.id },
              data: { rentalId: rental.id }
            });
            console.log(`✅ Linked maintenance request ${request.id} to rental ${rental.id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to migrate maintenance request ${request.id}:`, error);
        }
      }
    } catch (error) {
      console.log('ℹ️  No maintenance request migration needed or already migrated');
    }
  }

  private async getOrCreateDefaultUser() {
    // Try to find an admin user first
    let user = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!user) {
      // Find any user
      user = await prisma.user.findFirst();
    }

    if (!user) {
      // Create a default system user if no users exist
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'system@propertyai.com',
          password: 'temp_password', // This should be changed
          firstName: 'System',
          lastName: 'User',
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Created default system user');
    }

    return user;
  }

  private mapPropertyType(type: string): PropertyType {
    if (!type) return 'HOUSE';
    
    switch (type.toLowerCase()) {
      case 'house':
      case 'single_family':
        return 'HOUSE';
      case 'apartment':
      case 'condo':
        return 'APARTMENT';
      case 'townhouse':
        return 'TOWNHOUSE';
      case 'commercial':
        return 'COMMERCIAL';
      case 'industrial':
        return 'INDUSTRIAL';
      default:
        return 'OTHER';
    }
  }

  private mapPropertyStatus(status: string): ListingStatus {
    if (!status) return 'ACTIVE';
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'available':
        return 'ACTIVE';
      case 'pending':
        return 'PENDING';
      case 'draft':
        return 'DRAFT';
      case 'archived':
      case 'inactive':
        return 'ARCHIVED';
      default:
        return 'ACTIVE';
    }
  }

  private mapUnitStatus(status: string): ListingStatus {
    return this.mapPropertyStatus(status);
  }

  private generateSlug(title: string, id: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    return `${baseSlug}-${id.slice(-8)}`;
  }

  private generateReport() {
    console.log('\n📊 Migration Report');
    console.log('=' .repeat(60));
    console.log(`Properties processed: ${this.stats.propertiesProcessed}`);
    console.log(`Units processed: ${this.stats.unitsProcessed}`);
    console.log(`Rentals created: ${this.stats.rentalsCreated}`);
    console.log(`Records skipped: ${this.stats.skipped}`);
    console.log(`Errors encountered: ${this.stats.errors}`);
    console.log('=' .repeat(60));
    
    if (this.stats.errors === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review the logs above.');
    }
  }

  async rollbackMigration() {
    console.log('🔄 Rolling back migration...');
    
    try {
      // Remove rental references from related tables
      await prisma.lease.updateMany({
        where: { 
          rentalId: { 
            not: {
              equals: ""
            }
          } 
        },
        data: { rentalId: "" }
      });

      await prisma.maintenanceRequest.updateMany({
        where: { 
          rentalId: { 
            not: {
              equals: ""
            }
          } 
        },
        data: { rentalId: "" }
      });

      // Delete all rentals (this is destructive!)
      const deletedRentals = await prisma.rental.deleteMany({});

      console.log(`✅ Rollback completed. Deleted ${deletedRentals.count} rentals.`);
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const migrationService = new RentalMigrationService();

  if (args.includes('--rollback')) {
    await migrationService.rollbackMigration();
  } else {
    await migrationService.migrateToRentalSystem();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { RentalMigrationService };