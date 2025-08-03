
import { Request, Response, NextFunction } from 'express';

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

  const routeKey = `${req.method} ${req.route?.path || req.path}`;
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
