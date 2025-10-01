/**
 * Comprehensive Security Enhancements
 * Additional security middleware for production deployment
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Express } from 'express';
import { apiRateLimit, loginRateLimit, passwordResetRateLimit } from './rateLimit';
import { csrfProtection, attachCsrfToken } from './csrfProtection';

/**
 * Security headers configuration using Helmet
 */
export function configureSecurityHeaders(app: Express): void {
  // Use Helmet for various security headers
  app.use(helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.API_URL || 'http://localhost:3001'],
      },
    },
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }));
  
  // Additional custom headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    next();
  });
}

/**
 * Configure rate limiting for different route types
 */
export function configureRateLimiting(app: Express): void {
  // Apply general rate limiting to all API routes
  app.use('/api', apiRateLimit);
  
  // Stricter rate limiting for authentication routes
  app.use('/api/auth/login', loginRateLimit);
  app.use('/api/auth/register', loginRateLimit);
  app.use('/api/auth/password-reset', passwordResetRateLimit);
  app.use('/api/auth/forgot-password', passwordResetRateLimit);
}

/**
 * Configure CSRF protection
 */
export function configureCsrfProtection(app: Express): void {
  // Endpoint to get CSRF token
  app.get('/api/csrf-token', attachCsrfToken, (req: Request, res: Response) => {
    res.json({
      success: true,
      csrfToken: res.locals.csrfToken,
    });
  });
  
  // Apply CSRF protection to all state-changing API routes
  // Exclude certain routes that use other authentication (like API keys)
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for specific routes
    const skipRoutes = [
      '/api/webhooks',
      '/api/auth/login',
      '/api/auth/register',
      '/api/health',
    ];
    
    if (skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }
    
    csrfProtection(req, res, next);
  });
}

/**
 * Input sanitization middleware
 * Prevents XSS and injection attacks
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Sanitize a string to prevent XSS
 */
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Security audit logging middleware
 * Logs security-relevant events
 */
export function securityAuditLog(req: Request, res: Response, next: NextFunction): void {
  // Log security-relevant requests
  const securityPaths = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/password-reset',
    '/api/admin',
    '/api/users',
  ];
  
  const shouldLog = securityPaths.some(path => req.path.startsWith(path));
  
  if (shouldLog) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: (req.user as any)?.id || 'anonymous',
    };
    
    console.log('[SECURITY_AUDIT]', JSON.stringify(logEntry));
    
    // In production, send to audit logging service
    // auditService.logSecurityEvent(logEntry);
  }
  
  next();
}

/**
 * Request size limiter
 * Prevents large payload attacks
 */
export function requestSizeLimiter(maxSize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          success: false,
          message: 'Request payload too large',
          maxSize,
        });
      }
    }
    
    next();
  };
}

/**
 * Parse size string (e.g., "10mb") to bytes
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
  
  if (!match) {
    return 10 * 1024 * 1024; // Default 10MB
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  return value * (units[unit] || 1);
}

/**
 * Apply all security enhancements to an Express app
 */
export function applySecurityEnhancements(app: Express): void {
  console.log('[SECURITY] Applying security enhancements...');
  
  // 1. Security headers
  configureSecurityHeaders(app);
  console.log('[SECURITY] ✓ Security headers configured');
  
  // 2. Rate limiting
  configureRateLimiting(app);
  console.log('[SECURITY] ✓ Rate limiting configured');
  
  // 3. CSRF protection
  configureCsrfProtection(app);
  console.log('[SECURITY] ✓ CSRF protection configured');
  
  // 4. Input sanitization
  app.use(sanitizeInput);
  console.log('[SECURITY] ✓ Input sanitization enabled');
  
  // 5. Security audit logging
  app.use(securityAuditLog);
  console.log('[SECURITY] ✓ Security audit logging enabled');
  
  // 6. Request size limiting
  app.use(requestSizeLimiter('10mb'));
  console.log('[SECURITY] ✓ Request size limiting enabled');
  
  console.log('[SECURITY] All security enhancements applied successfully');
}

export default {
  applySecurityEnhancements,
  configureSecurityHeaders,
  configureRateLimiting,
  configureCsrfProtection,
  sanitizeInput,
  securityAuditLog,
  requestSizeLimiter,
};
