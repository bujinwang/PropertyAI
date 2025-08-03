import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

const prisma = new PrismaClient();

interface LegacyRouteInfo {
  path: string;
  method: string;
  newPath: string;
  deprecationDate: Date;
  removalDate: Date;
  usageCount: number;
}

class LegacyRoutePhaseOutService {
  private legacyRoutes: LegacyRouteInfo[] = [
    {
      path: '/api/properties',
      method: 'GET',
      newPath: '/api/rentals',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      usageCount: 0
    },
    {
      path: '/api/properties/:id',
      method: 'GET',
      newPath: '/api/rentals/:id',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      usageCount: 0
    },
    {
      path: '/api/units',
      method: 'GET',
      newPath: '/api/rentals',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      usageCount: 0
    },
    {
      path: '/api/units/:id',
      method: 'GET',
      newPath: '/api/rentals/:id',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      usageCount: 0
    },
    {
      path: '/api/listings',
      method: 'GET',
      newPath: '/api/rentals',
      deprecationDate: new Date('2024-02-01'),
      removalDate: new Date('2024-05-01'),
      usageCount: 0
    }
  ];

  async analyzeUsage() {
    console.log('📊 Analyzing legacy route usage');
    console.log('=' .repeat(50));

    // In a real implementation, you would analyze server logs
    // For now, we'll simulate usage data
    for (const route of this.legacyRoutes) {
      // Simulate usage count (in real app, query from logs/analytics)
      route.usageCount = Math.floor(Math.random() * 100);
      
      const status = this.getRouteStatus(route);
      console.log(`${status} ${route.method} ${route.path} → ${route.newPath} (${route.usageCount} uses)`);
    }
  }

  private getRouteStatus(route: LegacyRouteInfo): string {
    const now = new Date();
    if (now < route.deprecationDate) {
      return '🟢'; // Active
    } else if (now < route.removalDate) {
      return '🟡'; // Deprecated
    } else {
      return '🔴'; // Should be removed
    }
  }

  async createDeprecationWarnings() {
    console.log('\n⚠️  Creating deprecation warning middleware');
    console.log('-' .repeat(50));

    const middlewareCode = `
// Legacy Route Deprecation Middleware
import { Request, Response, NextFunction } from 'express';

const DEPRECATION_WARNINGS = {
  '/api/properties': {
    newPath: '/api/rentals',
    removalDate: '2024-05-01',
    message: 'The /api/properties endpoint is deprecated. Please use /api/rentals instead.'
  },
  '/api/units': {
    newPath: '/api/rentals',
    removalDate: '2024-05-01',
    message: 'The /api/units endpoint is deprecated. Please use /api/rentals instead.'
  },
  '/api/listings': {
    newPath: '/api/rentals',
    removalDate: '2024-05-01',
    message: 'The /api/listings endpoint is deprecated. Please use /api/rentals instead.'
  }
};

export const deprecationWarning = (req: Request, res: Response, next: NextFunction) => {
  const basePath = req.path.split('/').slice(0, 3).join('/'); // Get base path like /api/properties
  const warning = DEPRECATION_WARNINGS[basePath];
  
  if (warning) {
    res.set({
      'Deprecation': 'true',
      'Sunset': warning.removalDate,
      'Link': \`<\${warning.newPath}>; rel="successor-version"\`,
      'Warning': \`299 - "\${warning.message}"\`
    });
    
    // Log usage for analytics
    console.warn(\`DEPRECATED ROUTE USED: \${req.method} \${req.path} by \${req.ip}\`);
  }
  
  next();
};

// Usage in legacy routes:
// router.use('/api/properties', deprecationWarning);
// router.use('/api/units', deprecationWarning);
// router.use('/api/listings', deprecationWarning);
`;

    // Write middleware to file
    const middlewarePath = path.join(__dirname