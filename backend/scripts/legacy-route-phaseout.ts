import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

const prisma = new PrismaClient();

interface LegacyRoute {
  path: string;
  method: string;
  newPath: string;
  deprecationDate: Date;
  removalDate: Date;
  status: 'active' | 'deprecated' | 'removed';
}

class LegacyRoutePhaseoutService {
  private legacyRoutes: LegacyRoute[] = [
    // Property routes
    {
      path: '/api/properties',
      method: 'GET',
      newPath: '/api/rentals',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/properties/:id',
      method: 'GET',
      newPath: '/api/rentals/:id',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/properties',
      method: 'POST',
      newPath: '/api/rentals',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/properties/:id',
      method: 'PUT',
      newPath: '/api/rentals/:id',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/properties/:id',
      method: 'DELETE',
      newPath: '/api/rentals/:id',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    // Unit routes
    {
      path: '/api/units',
      method: 'GET',
      newPath: '/api/rentals?type=unit',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/units/:id',
      method: 'GET',
      newPath: '/api/rentals/:id',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/properties/:propertyId/units',
      method: 'GET',
      newPath: '/api/rentals/:parentId/units',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/properties/:propertyId/units',
      method: 'POST',
      newPath: '/api/rentals',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/units/:id',
      method: 'PUT',
      newPath: '/api/rentals/:id',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    },
    {
      path: '/api/units/:id',
      method: 'DELETE',
      newPath: '/api/rentals/:id',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      status: 'deprecated'
    }
  ];

  async executePhaseoutPlan() {
    console.log('🚧 Executing Legacy Route Phase-out Plan');
    console.log('=' .repeat(60));

    try {
      // Step 1: Add deprecation warnings to existing routes
      await this.addDeprecationWarnings();

      // Step 2: Create route mapping middleware
      await this.createRouteMappingMiddleware();

      // Step 3: Generate migration guide
      await this.generateMigrationGuide();

      // Step 4: Create monitoring for legacy route usage
      await this.setupLegacyRouteMonitoring();

      // Step 5: Generate phase-out timeline
      this.generatePhaseoutTimeline();

      console.log('\n🎉 Phase-out plan executed successfully!');

    } catch (error) {
      console.error('❌ Phase-out plan execution failed:', error);
      throw error;
    }
  }

  private async addDeprecationWarnings() {
    console.log('\n⚠️  Adding deprecation warnings to legacy routes');
    console.log('-' .repeat(40));

    const deprecationMiddleware = `
// Legacy Route Deprecation Middleware
export const deprecationWarning = (newPath: string, removalDate: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add deprecation headers
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Deprecation-Date', new Date().toISOString());
    res.setHeader('X-API-Removal-Date', removalDate);
    res.setHeader('X-API-New-Path', newPath);
    
    // Log deprecation usage
    console.warn(\`DEPRECATED API USAGE: \${req.method} \${req.path} - Use \${newPath} instead. Removal date: \${removalDate}\`);
    
    // Add warning to response body
    const originalSend = res.send;
    res.send = function(data) {
      if (typeof data === 'object') {
        data._deprecation = {
          message: \`This endpoint is deprecated. Use \${newPath} instead.\`,
          removalDate: removalDate,
          newPath: newPath
        };
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Usage in legacy routes:
// router.get('/api/properties', deprecationWarning('/api/rentals', '2024-05-01'), getProperties);
`;

    // Write middleware to file
    const middlewarePath = path.join(process.cwd(), 'src', 'middleware', 'deprecation.ts');
    fs.writeFileSync(middlewarePath, deprecationMiddleware);
    console.log(`✅ Created deprecation middleware: ${middlewarePath}`);
  }

  private async createRouteMappingMiddleware() {
    console.log('\n🗺️  Creating route mapping middleware');
    console.log('-' .repeat(40));

    const routeMappingMiddleware = `
// Route Mapping Middleware for Legacy Support
export const legacyRouteMapper = (req: Request, res: Response, next: NextFunction) => {
  const legacyMappings: Record<string, string> = {
    // Property mappings
    'GET /api/properties': 'GET /api/rentals',
    'POST /api/properties': 'POST /api/rentals',
    'GET /api/properties/:id': 'GET /api/rentals/:id',
    'PUT /api/properties/:id': 'PUT /api/rentals/:id',
    'DELETE /api/properties/:id': 'DELETE /api/rentals/:id',
    
    // Unit mappings
    'GET /api/units': 'GET /api/rentals?type=unit',
    'GET /api/units/:id': 'GET /api/rentals/:id',
    'PUT /api/units/:id': 'PUT /api/rentals/:id',
    'DELETE /api/units/:id': 'DELETE /api/rentals/:id',
    'GET /api/properties/:propertyId/units': 'GET /api/rentals/:parentId/units',
    'POST /api/properties/:propertyId/units': 'POST /api/rentals',
  };

  const routeKey = \`\${req.method} \${req.route?.path || req.path}\`;
  const mappedRoute = legacyMappings[routeKey];

  if (mappedRoute) {
    // Transform request for new API
    if (req.path.includes('/units') && req.method === 'GET' && !req.params.id) {
      req.query.type = 'unit';
    }
    
    if (req.path.includes('/properties') && req.path.includes('/units')) {
      // Map property-unit relationship
      req.body.parentRentalId = req.params.propertyId;
    }

    // Add legacy tracking
    req.headers['x-legacy-route'] = 'true';
    req.headers['x-original-path'] = req.path;
  }

  next();
};
`;

    const mappingPath = path.join(process.cwd(), 'src', 'middleware', 'legacy-mapping.ts');
    fs.writeFileSync(mappingPath, routeMappingMiddleware);
    console.log(`✅ Created route mapping middleware: ${mappingPath}`);
  }

  private async generateMigrationGuide() {
    console.log('\n📚 Generating migration guide');
    console.log('-' .repeat(40));

    const migrationGuide = `
# API Migration Guide: Properties & Units → Rentals

## Overview
We are consolidating the Properties and Units APIs into a unified Rentals API for better consistency and maintainability.

## Timeline
- **Deprecation Date**: February 1, 2024
- **Removal Date**: May 1, 2024
- **Migration Period**: 3 months

## Breaking Changes

### 1. Endpoint Changes

#### Properties API → Rentals API
| Legacy Endpoint | New Endpoint | Notes |
|----------------|--------------|-------|
| \`GET /api/properties\` | \`GET /api/rentals\` | Same functionality |
| \`GET /api/properties/:id\` | \`GET /api/rentals/:id\` | Same functionality |
| \`POST /api/properties\` | \`POST /api/rentals\` | See schema changes below |
| \`PUT /api/properties/:id\` | \`PUT /api/rentals/:id\` | See schema changes below |
| \`DELETE /api/properties/:id\` | \`DELETE /api/rentals/:id\` | Same functionality |

#### Units API → Rentals API
| Legacy Endpoint | New Endpoint | Notes |
|----------------|--------------|-------|
| \`GET /api/units\` | \`GET /api/rentals?type=unit\` | Filter by type |
| \`GET /api/units/:id\` | \`GET /api/rentals/:id\` | Same functionality |
| \`GET /api/properties/:id/units\` | \`GET /api/rentals/:id/units\` | Parent-child relationship |
| \`POST /api/properties/:id/units\` | \`POST /api/rentals\` | Set \`parentRentalId\` |
| \`PUT /api/units/:id\` | \`PUT /api/rentals/:id\` | Same functionality |
| \`DELETE /api/units/:id\` | \`DELETE /api/rentals/:id\` | Same functionality |

### 2. Schema Changes

#### New Fields in Rental Model
- \`type\`: RentalType enum (HOUSE, APARTMENT, CONDO, TOWNHOUSE, STUDIO, OTHER)
- \`parentRentalId\`: For unit relationships
- \`legacyPropertyId\`: Reference to original property
- \`legacyUnitId\`: Reference to original unit

#### Removed Fields
- Property-specific fields are now unified in the rental model
- Unit-specific fields are now part of the rental model

### 3. Response Format Changes

#### Before (Properties)
\`\`\`json
{
  "id": "prop_123",
  "name": "Sunset Apartments",
  "address": "123 Main St",
  "units": [...]
}
\`\`\`

#### After (Rentals)
\`\`\`json
{
  "id": "rental_456",
  "title": "Sunset Apartments",
  "type": "APARTMENT",
  "address": "123 Main St",
  "childRentals": [...],
  "legacyPropertyId": "prop_123"
}
\`\`\`

## Migration Steps

### 1. Update API Calls
Replace all property and unit API calls with rental API calls according to the mapping table above.

### 2. Update Request/Response Handling
- Update field names (\`name\` → \`title\`)
- Handle new \`type\` field
- Update relationship handling (\`units\` → \`childRentals\`)

### 3. Update Database Queries
If you're directly querying the database:
- Use \`rental\` table instead of \`property\` and \`unit\` tables
- Update foreign key references
- Use \`parentRentalId\` for unit relationships

### 4. Testing
- Test all API integrations with new endpoints
- Verify data migration completed successfully
- Test backward compatibility during transition period

## Code Examples

### Before (Legacy)
\`\`\`javascript
// Get all properties
const properties = await fetch('/api/properties');

// Get property units
const units = await fetch('/api/properties/123/units');

// Create new unit
await fetch('/api/properties/123/units', {
  method: 'POST',
  body: JSON.stringify(unitData)
});
\`\`\`

### After (New)
\`\`\`javascript
// Get all rentals (properties)
const rentals = await fetch('/api/rentals');

// Get rental units
const units = await fetch('/api/rentals/123/units');

// Create new unit
await fetch('/api/rentals', {
  method: 'POST',
  body: JSON.stringify({
    ...unitData,
    parentRentalId: '123'
  })
});
\`\`\`

## Support

During the migration period:
- Legacy endpoints will continue to work with deprecation warnings
- New endpoints are available immediately
- Contact support for migration assistance

## Deprecation Warnings

Legacy endpoints will return deprecation headers:
- \`X-API-Deprecated: true\`
- \`X-API-Removal-Date: 2024-05-01\`
- \`X-API-New-Path: /api/rentals\`

Response bodies will include deprecation notices in the \`_deprecation\` field.
`;

    const guidePath = path.join(process.cwd(), 'docs', 'API_MIGRATION_GUIDE.md');
    fs.mkdirSync(path.dirname(guidePath), { recursive: true });
    fs.writeFileSync(guidePath, migrationGuide);
    console.log(`✅ Created migration guide: ${guidePath}`);
  }

  private async setupLegacyRouteMonitoring() {
    console.log('\n📊 Setting up legacy route monitoring');
    console.log('-' .repeat(40));

    const monitoringCode = `
// Legacy Route Usage Monitoring
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LegacyRouteUsage {
  route: string;
  method: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  userId?: string;
}

export class LegacyRouteMonitor {
  static async logUsage(req: Request, route: string) {
    try {
      await prisma.legacyRouteUsage.create({
        data: {
          route: route,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          userId: req.user?.id,
          timestamp: new Date(),
        }
      });
    } catch (error) {
      console.error('Failed to log legacy route usage:', error);
    }
  }

  static async getUsageStats(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await prisma.legacyRouteUsage.groupBy({
      by: ['route', 'method'],
      where: {
        timestamp: { gte: since }
      },
      _count: true,
      orderBy: {
        _count: { route: 'desc' }
      }
    });

    return stats;
  }

  static async generateUsageReport() {
    const stats = await this.getUsageStats();
    
    console.log('\\n📊 Legacy Route Usage Report (Last 30 days)');
    console.log('=' .repeat(60));
    
    stats.forEach(stat => {
      console.log(\`\${stat.method} \${stat.route}: \${stat._count} requests\`);
    });
    
    return stats;
  }
}

// Middleware to track legacy route usage
export const trackLegacyUsage = (route: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await LegacyRouteMonitor.logUsage(req, route);
    next();
  };
};
`;

    const monitoringPath = path.join(process.cwd(), 'src', 'utils', 'legacy-monitoring.ts');
    fs.mkdirSync(path.dirname(monitoringPath), { recursive: true });
    fs.writeFileSync(monitoringPath, monitoringCode);
    console.log(`✅ Created legacy route monitoring: ${monitoringPath}`);
  }

  public generatePhaseoutTimeline() {
    console.log('\n📅 Phase-out Timeline');
    console.log('=' .repeat(60));

    const now = new Date();
    const phases = [
      {
        phase: 'Phase 1: Deprecation Warnings',
        date: '2024-02-01',
        status: now >= new Date('2024-02-01') ? '✅ Complete' : '⏳ Pending',
        actions: [
          'Add deprecation headers to legacy endpoints',
          'Add deprecation notices to response bodies',
          'Begin logging legacy route usage',
          'Notify API consumers of upcoming changes'
        ]
      },
      {
        phase: 'Phase 2: Migration Support',
        date: '2024-03-01',
        status: now >= new Date('2024-03-01') ? '✅ Complete' : '⏳ Pending',
        actions: [
          'Provide migration tools and scripts',
          'Offer developer support for migration',
          'Create detailed migration documentation',
          'Monitor usage patterns and provide feedback'
        ]
      },
      {
        phase: 'Phase 3: Final Warnings',
        date: '2024-04-01',
        status: now >= new Date('2024-04-01') ? '✅ Complete' : '⏳ Pending',
        actions: [
          'Increase warning frequency',
          'Contact remaining users of legacy endpoints',
          'Provide final migration deadline reminders',
          'Prepare for endpoint removal'
        ]
      },
      {
        phase: 'Phase 4: Legacy Removal',
        date: '2024-05-01',
        status: now >= new Date('2024-05-01') ? '✅ Complete' : '⏳ Pending',
        actions: [
          'Remove legacy property and unit endpoints',
          'Update documentation to remove legacy references',
          'Monitor for any remaining legacy usage',
          'Provide post-migration support'
        ]
      }
    ];

    phases.forEach(phase => {
      console.log(`\n${phase.status} ${phase.phase} (${phase.date})`);
      phase.actions.forEach(action => {
        console.log(`  • ${action}`);
      });
    });

    console.log('\n📋 Current Legacy Routes Status:');
    this.legacyRoutes.forEach(route => {
      const statusIcon = route.status === 'active' ? '🟢' : 
                        route.status === 'deprecated' ? '🟡' : '🔴';
      console.log(`${statusIcon} ${route.method} ${route.path} → ${route.newPath}`);
    });
  }

  async removeDeprecatedRoutes() {
    console.log('\n🗑️  Removing deprecated routes');
    console.log('-' .repeat(40));

    const routesToRemove = this.legacyRoutes.filter(route => 
      route.status === 'deprecated' && new Date() >= route.removalDate
    );

    if (routesToRemove.length === 0) {
      console.log('ℹ️  No routes ready for removal yet.');
      return;
    }

    console.log(`Found ${routesToRemove.length} routes ready for removal:`);
    routesToRemove.forEach(route => {
      console.log(`  • ${route.method} ${route.path}`);
    });

    // In a real implementation, you would:
    // 1. Remove route handlers from Express app
    // 2. Update route files
    // 3. Remove middleware
    // 4. Update tests
    
    console.log('⚠️  Manual removal required - update route files and remove handlers');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const phaseoutService = new LegacyRoutePhaseoutService();

  if (args.includes('--remove')) {
    await phaseoutService.removeDeprecatedRoutes();
  } else if (args.includes('--timeline')) {
    phaseoutService.generatePhaseoutTimeline();
  } else {
    await phaseoutService.executePhaseoutPlan();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Phase-out plan failed:', error);
    process.exit(1);
  });
}

export { LegacyRoutePhaseoutService };