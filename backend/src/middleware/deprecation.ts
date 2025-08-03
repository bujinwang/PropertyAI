
import { Request, Response, NextFunction } from 'express';

// Legacy Route Deprecation Middleware
export const deprecationWarning = (newPath: string, removalDate: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add deprecation headers
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Deprecation-Date', new Date().toISOString());
    res.setHeader('X-API-Removal-Date', removalDate);
    res.setHeader('X-API-New-Path', newPath);
    
    // Log deprecation usage
    console.warn(`DEPRECATED API USAGE: ${req.method} ${req.path} - Use ${newPath} instead. Removal date: ${removalDate}`);
    
    // Add warning to response body
    const originalSend = res.send;
    res.send = function(data) {
      if (typeof data === 'object') {
        data._deprecation = {
          message: `This endpoint is deprecated. Use ${newPath} instead.`,
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
