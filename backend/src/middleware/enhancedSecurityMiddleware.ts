import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from './errorMiddleware';
import { enhancedAuditService } from '../services/enhancedAuditService';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface SecurityConfig {
  enableRateLimiting: boolean;
  enableRequestValidation: boolean;
  enableSuspiciousActivityDetection: boolean;
  maxRequestSize: string;
  allowedOrigins: string[];
  blockedIPs: string[];
}

// Default configurations
const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

const defaultSecurityConfig: SecurityConfig = {
  enableRateLimiting: true,
  enableRequestValidation: true,
  enableSuspiciousActivityDetection: true,
  maxRequestSize: '10mb',
  allowedOrigins: ['*'], // In production, specify allowed origins
  blockedIPs: [],
};

// Enhanced rate limiting with different tiers
export const createRateLimiter = (config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...defaultRateLimitConfig, ...config };

  return rateLimit({
    windowMs: finalConfig.windowMs,
    max: finalConfig.max,
    message: { error: finalConfig.message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: finalConfig.skipSuccessfulRequests,
    skipFailedRequests: finalConfig.skipFailedRequests,
    handler: (req: Request, res: Response) => {
      // Log rate limit violations
      enhancedAuditService.logEvent({
        userId: (req as any).user?.id,
        action: 'RATE_LIMIT_EXCEEDED',
        details: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          limit: finalConfig.max,
          windowMs: finalConfig.windowMs,
        },
        entityType: 'SECURITY',
        entityId: 'rate-limit',
        ipAddress: req.ip as string,
        userAgent: req.get('User-Agent') || '',
        severity: 'WARNING',
      });

      res.status(429).json({ error: finalConfig.message });
    },
  });
};

// Different rate limiters for different endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
});

export const sensitiveOperationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 sensitive operations per hour
  message: 'Too many sensitive operations, please try again later.',
});

// Request validation middleware
export const requestValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for common attack patterns
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /eval\(/i,  // Code injection
      /javascript:/i,  // JavaScript injection
    ];

    const checkValue = (value: any, path: string = ''): void => {
      if (typeof value === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            throw new AppError(`Suspicious content detected in ${path}`, 400);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const [key, val] of Object.entries(value)) {
          checkValue(val, `${path}.${key}`);
        }
      }
    };

    // Check request body
    if (req.body) {
      checkValue(req.body, 'body');
    }

    // Check query parameters
    if (req.query) {
      checkValue(req.query, 'query');
    }

    // Check headers for suspicious content
    const suspiciousHeaders = ['X-Forwarded-For', 'X-Real-IP', 'X-Client-IP'];
    for (const header of suspiciousHeaders) {
      const value = req.get(header);
      if (value) {
        checkValue(value, `header.${header}`);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// IP blocking middleware
export const ipBlockMiddleware = (blockedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (blockedIPs.includes(clientIP as string)) {
      enhancedAuditService.logEvent({
        action: 'BLOCKED_IP_ACCESS',
        details: {
          ipAddress: clientIP,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        },
        entityType: 'SECURITY',
        entityId: 'ip-block',
        ipAddress: clientIP as string,
        userAgent: req.get('User-Agent') || '',
        severity: 'WARNING',
      });

      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

// Suspicious activity detection
export const suspiciousActivityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  const path = req.path;
  const method = req.method;

  // Check for suspicious patterns
  const suspiciousIndicators = [];

  // Multiple rapid requests from same IP
  if (req.headers['x-forwarded-for'] && Array.isArray(req.headers['x-forwarded-for'])) {
    suspiciousIndicators.push('multiple-forwarded-ips');
  }

  // Unusual user agent
  if (!userAgent || userAgent.length < 10) {
    suspiciousIndicators.push('suspicious-user-agent');
  }

  // Access to sensitive endpoints
  const sensitiveEndpoints = ['/admin', '/api/users', '/api/financial'];
  if (sensitiveEndpoints.some(endpoint => path.includes(endpoint))) {
    suspiciousIndicators.push('sensitive-endpoint-access');
  }

  // Unusual request methods
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    suspiciousIndicators.push('unusual-method');
  }

  if (suspiciousIndicators.length > 0) {
    enhancedAuditService.logEvent({
      userId: (req as any).user?.id,
      action: 'SUSPICIOUS_ACTIVITY',
      details: {
        indicators: suspiciousIndicators,
        ipAddress: clientIP,
        userAgent,
        path,
        method,
        headers: req.headers,
      },
      entityType: 'SECURITY',
      entityId: 'suspicious-activity',
      ipAddress: clientIP as string,
      userAgent,
      severity: 'WARNING',
    });
  }

  next();
};

// CORS middleware with enhanced security
export const enhancedCorsMiddleware = (allowedOrigins: string[] = ['*']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  };
};

// Request size limiting
export const requestSizeMiddleware = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');

    if (contentLength > parseSize(maxSize)) {
      return next(new AppError('Request too large', 413));
    }

    next();
  };
};

const parseSize = (size: string): number => {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return value * (units[unit as keyof typeof units] || 1);
};

// Security headers middleware
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (basic)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
};

// Combined security middleware
export const createSecurityMiddleware = (config: Partial<SecurityConfig> = {}) => {
  const finalConfig = { ...defaultSecurityConfig, ...config };
  const middlewares = [];

  if (finalConfig.enableRateLimiting) {
    middlewares.push(apiRateLimiter);
  }

  if (finalConfig.enableRequestValidation) {
    middlewares.push(requestValidationMiddleware);
  }

  if (finalConfig.enableSuspiciousActivityDetection) {
    middlewares.push(suspiciousActivityMiddleware);
  }

  middlewares.push(ipBlockMiddleware(finalConfig.blockedIPs));
  middlewares.push(enhancedCorsMiddleware(finalConfig.allowedOrigins));
  middlewares.push(requestSizeMiddleware(finalConfig.maxRequestSize));
  middlewares.push(securityHeadersMiddleware);

  return middlewares;
};