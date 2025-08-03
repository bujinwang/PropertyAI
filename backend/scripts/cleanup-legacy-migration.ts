#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface CleanupOptions {
  dryRun: boolean;
  skipControllers: boolean;
  skipTests: boolean;
  skipDatabase: boolean;
  skipRoutes: boolean;
}

class LegacyCleanupManager {
  private options: CleanupOptions;
  private backendRoot: string;

  constructor(options: CleanupOptions) {
    this.options = options;
    this.backendRoot = path.resolve(__dirname, '..');
  }

  async run(): Promise<void> {
    console.log('🧹 Starting Legacy Migration Cleanup');
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
    console.log('=====================================\n');

    try {
      if (!this.options.skipControllers) {
        await this.cleanupLegacyControllers();
      }

      if (!this.options.skipTests) {
        await this.cleanupLegacyTests();
      }

      if (!this.options.skipRoutes) {
        await this.updateRouteRegistrations();
      }

      if (!this.options.skipDatabase) {
        await this.cleanupDatabase();
      }

      console.log('\n✅ Legacy cleanup completed successfully!');
      
      if (this.options.dryRun) {
        console.log('\n⚠️  This was a DRY RUN. No changes were made.');
        console.log('Run without --dry-run to execute the cleanup.');
      }

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  }

  private async cleanupLegacyControllers(): Promise<void> {
    console.log('📁 Cleaning up legacy controllers...');
    
    const controllersDir = path.join(this.backendRoot, 'src', 'controllers');
    const legacyControllers = [
      'propertyController.ts',
      'unitController.ts', 
      'listingController.ts'
    ];

    for (const controller of legacyControllers) {
      const controllerPath = path.join(controllersDir, controller);
      
      if (fs.existsSync(controllerPath)) {
        console.log(`  • Processing ${controller}...`);
        
        if (!this.options.dryRun) {
          // Create deprecation stub
          const deprecationStub = this.createControllerDeprecationStub(controller);
          fs.writeFileSync(controllerPath, deprecationStub);
        }
        
        console.log(`    ✓ ${this.options.dryRun ? 'Would replace' : 'Replaced'} with deprecation stub`);
      } else {
        console.log(`  • ${controller} not found, skipping...`);
      }
    }
  }

  private createControllerDeprecationStub(controllerName: string): string {
    const entityName = controllerName.replace('Controller.ts', '');
    const capitalizedEntity = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    
    return `import { Request, Response } from 'express';

/**
 * DEPRECATED: ${capitalizedEntity} Controller
 * 
 * This controller has been deprecated as part of the migration to the unified Rental model.
 * All ${entityName} operations have been consolidated into the Rental model.
 * 
 * Migration Guide:
 * - Use /api/rentals endpoints instead of /api/${entityName}s
 * - Update your client code to use rentalService
 * - See MIGRATION_GUIDE.md for detailed mapping
 * 
 * This controller will be removed in the next major version.
 */

const deprecatedResponse = (req: Request, res: Response) => {
  res.status(410).json({
    error: 'Endpoint Deprecated',
    message: \`The \${req.originalUrl} endpoint has been deprecated and consolidated into the Rental model.\`,
    migration: {
      newEndpoint: '/api/rentals',
      documentation: '/docs/migration-guide',
      deprecatedSince: '2025-01-02',
      removalDate: '2025-02-01'
    }
  });
};

// All legacy endpoints return deprecation notice
export const getAll${capitalizedEntity}s = deprecatedResponse;
export const create${capitalizedEntity} = deprecatedResponse;
export const get${capitalizedEntity}ById = deprecatedResponse;
export const update${capitalizedEntity} = deprecatedResponse;
export const delete${capitalizedEntity} = deprecatedResponse;
export const getPublic${capitalizedEntity}s = deprecatedResponse;

// Export default for backward compatibility
export default {
  getAll${capitalizedEntity}s,
  create${capitalizedEntity},
  get${capitalizedEntity}ById,
  update${capitalizedEntity},
  delete${capitalizedEntity},
  getPublic${capitalizedEntity}s
};
`;
  }

  private async cleanupLegacyTests(): Promise<void> {
    console.log('🧪 Cleaning up legacy tests...');
    
    const testsDir = path.join(this.backendRoot, 'src', '__tests__');
    const legacyTestFiles = [
      'propertyController.test.ts',
      'unitController.test.ts',
      'listingController.test.ts',
      'propertyService.test.ts',
      'unitService.test.ts',
      'listingService.test.ts'
    ];

    // Create legacy tests directory
    const legacyTestsDir = path.join(testsDir, 'legacy');
    
    if (!this.options.dryRun && !fs.existsSync(legacyTestsDir)) {
      fs.mkdirSync(legacyTestsDir, { recursive: true });
    }

    for (const testFile of legacyTestFiles) {
      const testPath = path.join(testsDir, testFile);
      const legacyTestPath = path.join(legacyTestsDir, testFile);
      
      if (fs.existsSync(testPath)) {
        console.log(`  • Moving ${testFile} to legacy directory...`);
        
        if (!this.options.dryRun) {
          fs.renameSync(testPath, legacyTestPath);
        }
        
        console.log(`    ✓ ${this.options.dryRun ? 'Would move' : 'Moved'} to legacy/`);
      } else {
        console.log(`  • ${testFile} not found, skipping...`);
      }
    }

    // Update setup.ts to remove legacy mocks
    const setupPath = path.join(testsDir, 'setup.ts');
    if (fs.existsSync(setupPath)) {
      console.log('  • Updating test setup to remove legacy mocks...');
      
      if (!this.options.dryRun) {
        let setupContent = fs.readFileSync(setupPath, 'utf8');
        
        // Remove legacy model mocks
        setupContent = setupContent.replace(/property:\s*\{[^}]*\},?\s*/g, '');
        setupContent = setupContent.replace(/unit:\s*\{[^}]*\},?\s*/g, '');
        setupContent = setupContent.replace(/listing:\s*\{[^}]*\},?\s*/g, '');
        
        fs.writeFileSync(setupPath, setupContent);
      }
      
      console.log(`    ✓ ${this.options.dryRun ? 'Would update' : 'Updated'} test setup`);
    }
  }

  private async updateRouteRegistrations(): Promise<void> {
    console.log('🛣️  Updating route registrations...');
    
    const routesIndexPath = path.join(this.backendRoot, 'src', 'routes', 'index.ts');
    
    if (fs.existsSync(routesIndexPath)) {
      console.log('  • Commenting out legacy route registrations...');
      
      if (!this.options.dryRun) {
        let routesContent = fs.readFileSync(routesIndexPath, 'utf8');
        
        // Comment out legacy route registrations
        routesContent = routesContent.replace(
          /app\.use\(['"`]\/api\/properties['"`],\s*propertyRoutes\);?/g,
          '// app.use(\'/api/properties\', propertyRoutes); // DEPRECATED: Use /api/rentals'
        );
        routesContent = routesContent.replace(
          /app\.use\(['"`]\/api\/units['"`],\s*unitRoutes\);?/g,
          '// app.use(\'/api/units\', unitRoutes); // DEPRECATED: Use /api/rentals'
        );
        routesContent = routesContent.replace(
          /app\.use\(['"`]\/api\/listings['"`],\s*listingRoutes\);?/g,
          '// app.use(\'/api/listings\', listingRoutes); // DEPRECATED: Use /api/rentals'
        );
        
        fs.writeFileSync(routesIndexPath, routesContent);
      }
      
      console.log(`    ✓ ${this.options.dryRun ? 'Would comment out' : 'Commented out'} legacy routes`);
    }
  }

  private async cleanupDatabase(): Promise<void> {
    console.log('🗄️  Database cleanup...');
    
    if (this.options.dryRun) {
      console.log('  • Would execute database migration to drop legacy tables');
      console.log('    - Drop PropertyImage, UnitImage, ListingImage tables');
      console.log('    - Drop Listing, Unit, Property tables');
      console.log('    - Add performance indexes to Rental table');
      return;
    }

    try {
      console.log('  • Executing database migration...');
      
      // Create migration SQL
      const migrationSQL = `
-- Remove legacy tables and add Rental performance indexes
-- Generated by cleanup-legacy-migration.ts

-- Drop image tables first (they have foreign keys)
DROP TABLE IF EXISTS "PropertyImage";
DROP TABLE IF EXISTS "UnitImage"; 
DROP TABLE IF EXISTS "ListingImage";

-- Drop main legacy tables
DROP TABLE IF EXISTS "Listing";
DROP TABLE IF EXISTS "Unit";
DROP TABLE IF EXISTS "Property";

-- Add performance indexes to Rental table
CREATE INDEX IF NOT EXISTS "idx_rental_property_type" ON "Rental"("propertyType");
CREATE INDEX IF NOT EXISTS "idx_rental_status" ON "Rental"("status");
CREATE INDEX IF NOT EXISTS "idx_rental_price" ON "Rental"("price");
CREATE INDEX IF NOT EXISTS "idx_rental_location" ON "Rental"("city", "state");
CREATE INDEX IF NOT EXISTS "idx_rental_created_at" ON "Rental"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_rental_user_id" ON "Rental"("userId");

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_rental_search" ON "Rental"("propertyType", "status", "price");
CREATE INDEX IF NOT EXISTS "idx_rental_location_search" ON "Rental"("city", "state", "propertyType", "status");
`;

      const migrationDir = path.join(this.backendRoot, 'prisma', 'migrations', '20250102_cleanup_legacy');
      if (!fs.existsSync(migrationDir)) {
        fs.mkdirSync(migrationDir, { recursive: true });
      }
      
      const migrationFile = path.join(migrationDir, 'migration.sql');
      fs.writeFileSync(migrationFile, migrationSQL);
      
      // Execute migration
      execSync('npx prisma db push', { 
        cwd: this.backendRoot,
        stdio: 'inherit'
      });
      
      console.log('    ✓ Database migration completed');
      
    } catch (error) {
      console.error('    ❌ Database migration failed:', error);
      throw error;
    }
  }
}

// Parse command line arguments
function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    skipControllers: args.includes('--skip-controllers'),
    skipTests: args.includes('--skip-tests'),
    skipDatabase: args.includes('--skip-database'),
    skipRoutes: args.includes('--skip-routes')
  };
}

// Main execution
async function main() {
  const options = parseArgs();
  const cleanup = new LegacyCleanupManager(options);
  await cleanup.run();
}

if (require.main === module) {
  main().catch(console.error);
}