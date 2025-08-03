import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

interface MigrationStats {
  propertiesProcessed: number;
  unitsProcessed: number;
  listingsProcessed: number;
  rentalsCreated: number;
  errors: string[];
}

class RentalMigrationService {
  private stats: MigrationStats = {
    propertiesProcessed: 0,
    unitsProcessed: 0,
    listingsProcessed: 0,
    rentalsCreated: 0,
    errors: []
  };

  async migrateData(dryRun: boolean = true) {
    console.log(`🚀 Starting data migration to Rental model (${dryRun ? 'DRY RUN' : 'LIVE RUN'})`);
    console.log('=' .repeat(80));

    try {
      // Step 1: Migrate from Properties + Units
      await this.migrateFromPropertiesAndUnits(dryRun);
      
      // Step 2: Migrate from standalone Listings
      await this.migrateFromListings(dryRun);
      
      // Step 3: Update related data
      if (!dryRun) {
        await this.updateRelatedData();
      }
      
      this.printMigrationSummary();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async migrateFromPropertiesAndUnits(dryRun: boolean) {
    console.log('\n📋 Step 1: Migrating Properties + Units to Rentals');
    console.log('-' .repeat(50));

    // Get all properties with their units
    const properties = await prisma.property.findMany({
      include: {
        units: true,
        Manager: true,
        Owner: true,
      }
    });

    console.log(`Found ${properties.length} properties to process`);

    for (const property of properties) {
      try {
        this.stats.propertiesProcessed++;
        
        if (property.units.length === 0) {
          // Property without units - create a single rental
          const rentalData = this.mapPropertyToRental(property);
          
          if (!dryRun) {
            await prisma.rental.create({ data: rentalData });
            this.stats.rentalsCreated++;
          }
          
          console.log(`✅ Property "${property.name}" → Rental (no units)`);
        } else {
          // Property with units - create rental for each unit
          for (const unit of property.units) {
            try {
              this.stats.unitsProcessed++;
              
              const rentalData = this.mapPropertyUnitToRental(property, unit);
              
              if (!dryRun) {
                await prisma.rental.create({ data: rentalData });
                this.stats.rentalsCreated++;
              }
              
              console.log(`✅ Property "${property.name}" + Unit "${unit.unitNumber}" → Rental`);
            } catch (error) {
              const errorMsg = `Failed to migrate unit ${unit.id}: ${error}`;
              this.stats.errors.push(errorMsg);
              console.error(`❌ ${errorMsg}`);
            }
          }
        }
      } catch (error) {
        const errorMsg = `Failed to migrate property ${property.id}: ${error}`;
        this.stats.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
  }

  private async migrateFromListings(dryRun: boolean) {
    console.log('\n📋 Step 2: Migrating standalone Listings to Rentals');
    console.log('-' .repeat(50));

    // Get listings that don't have corresponding property/unit
    const listings = await prisma.listing.findMany({
      where: {
        OR: [
          { propertyId: null },
          { unitId: null }
        ]
      },
      include: {
        property: true,
        unit: true,
      }
    });

    console.log(`Found ${listings.length} standalone listings to process`);

    for (const listing of listings) {
      try {
        this.stats.listingsProcessed++;
        
        const rentalData = this.mapListingToRental(listing);
        
        if (!dryRun) {
          await prisma.rental.create({ data: rentalData });
          this.stats.rentalsCreated++;
        }
        
        console.log(`✅ Listing "${listing.title}" → Rental`);
      } catch (error) {
        const errorMsg = `Failed to migrate listing ${listing.id}: ${error}`;
        this.stats.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
  }

  private async updateRelatedData() {
    console.log('\n📋 Step 3: Updating related data references');
    console.log('-' .repeat(50));

    // Update applications to reference rentals instead of properties/units
    // This would require additional logic based on your specific schema
    console.log('ℹ️  Related data updates would be implemented based on specific requirements');
  }

  private mapPropertyToRental(property: any) {
    return {
      title: property.name || `Property at ${property.address}`,
      description: property.description || `Property located at ${property.address}`,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      country: property.country || 'USA',
      propertyType: this.mapPropertyType(property.type),
      bedrooms: property.bedrooms || null,
      bathrooms: property.bathrooms || null,
      squareFootage: property.squareFootage || null,
      rent: property.rent || 0,
      deposit: property.deposit || property.rent || 0,
      isAvailable: property.isAvailable ?? true,
      availableDate: property.availableDate || new Date(),
      listingStatus: this.mapListingStatus(property.status),
      isActive: property.isActive ?? true,
      managerId: property.managerId,
      ownerId: property.ownerId,
      // Additional fields
      yearBuilt: property.yearBuilt,
      lotSize: property.lotSize,
      parkingSpaces: property.parkingSpaces,
      amenities: property.amenities || [],
      images: property.images || [],
      // Legacy references for tracking
      legacyPropertyId: property.id,
      migrationSource: 'PROPERTY',
      createdAt: property.createdAt,
      updatedAt: new Date(),
    };
  }

  private mapPropertyUnitToRental(property: any, unit: any) {
    return {
      title: `${property.name} - Unit ${unit.unitNumber}`,
      description: unit.description || property.description || `Unit ${unit.unitNumber} at ${property.address}`,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      country: property.country || 'USA',
      propertyType: this.mapPropertyType(property.type),
      bedrooms: unit.bedrooms || property.bedrooms || null,
      bathrooms: unit.bathrooms || property.bathrooms || null,
      squareFootage: unit.squareFootage || property.squareFootage || null,
      rent: unit.rent || property.rent || 0,
      deposit: unit.deposit || property.deposit || unit.rent || property.rent || 0,
      isAvailable: unit.isAvailable ?? property.isAvailable ?? true,
      availableDate: unit.availableDate || property.availableDate || new Date(),
      listingStatus: this.mapListingStatus(unit.status || property.status),
      isActive: unit.isActive ?? property.isActive ?? true,
      managerId: property.managerId,
      ownerId: property.ownerId,
      // Unit-specific fields
      unitNumber: unit.unitNumber,
      floorNumber: unit.floorNumber,
      // Additional fields
      yearBuilt: property.yearBuilt,
      parkingSpaces: unit.parkingSpaces || property.parkingSpaces,
      amenities: [...(unit.amenities || []), ...(property.amenities || [])],
      images: [...(unit.images || []), ...(property.images || [])],
      // Legacy references for tracking
      legacyPropertyId: property.id,
      legacyUnitId: unit.id,
      migrationSource: 'PROPERTY_UNIT',
      createdAt: unit.createdAt || property.createdAt,
      updatedAt: new Date(),
    };
  }

  private mapListingToRental(listing: any) {
    return {
      title: listing.title,
      description: listing.description,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zipCode: listing.zipCode,
      country: listing.country || 'USA',
      propertyType: this.mapPropertyType(listing.propertyType),
      bedrooms: listing.bedrooms || null,
      bathrooms: listing.bathrooms || null,
      squareFootage: listing.squareFootage || null,
      rent: listing.rent || 0,
      deposit: listing.deposit || listing.rent || 0,
      isAvailable: listing.isAvailable ?? true,
      availableDate: listing.availableDate || new Date(),
      listingStatus: this.mapListingStatus(listing.status),
      isActive: listing.isActive ?? true,
      // Additional fields from listing
      amenities: listing.amenities || [],
      images: listing.images || [],
      // Legacy references for tracking
      legacyListingId: listing.id,
      migrationSource: 'LISTING',
      createdAt: listing.createdAt,
      updatedAt: new Date(),
    };
  }

  private mapPropertyType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'APARTMENT': 'APARTMENT',
      'HOUSE': 'HOUSE',
      'CONDO': 'CONDO',
      'TOWNHOUSE': 'TOWNHOUSE',
      'COMMERCIAL': 'COMMERCIAL',
      'INDUSTRIAL': 'INDUSTRIAL',
      'SINGLE_FAMILY': 'HOUSE',
      'MULTI_FAMILY': 'APARTMENT',
      'STUDIO': 'APARTMENT',
    };
    
    return typeMap[type?.toUpperCase()] || 'OTHER';
  }

  private mapListingStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'ACTIVE',
      'PENDING': 'PENDING',
      'DRAFT': 'DRAFT',
      'ARCHIVED': 'ARCHIVED',
      'INACTIVE': 'ARCHIVED',
      'PUBLISHED': 'ACTIVE',
      'UNPUBLISHED': 'DRAFT',
    };
    
    return statusMap[status?.toUpperCase()] || 'DRAFT';
  }

  private printMigrationSummary() {
    console.log('\n📊 Migration Summary');
    console.log('=' .repeat(80));
    console.log(`Properties processed: ${this.stats.propertiesProcessed}`);
    console.log(`Units processed: ${this.stats.unitsProcessed}`);
    console.log(`Listings processed: ${this.stats.listingsProcessed}`);
    console.log(`Rentals created: ${this.stats.rentalsCreated}`);
    console.log(`Errors encountered: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.stats.errors.length === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the errors above.');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');
  
  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode. Use --live flag to perform actual migration.');
  } else {
    console.log('⚠️  Running in LIVE mode. This will modify your database!');
    
    // Confirmation prompt for live runs
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      readline.question('Are you sure you want to proceed? (yes/no): ', resolve);
    });
    
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('Migration cancelled.');
      process.exit(0);
    }
  }
  
  const migrationService = new RentalMigrationService();
  await migrationService.migrateData(dryRun);
}

// Run the migration
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { RentalMigrationService };