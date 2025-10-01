/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';

// Store for CSRF tokens (in production, use Redis)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

// Token expiration time (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokenStore.entries()) {
    if (data.expires < now) {
      csrfTokenStore.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get or create CSRF token for a session
 */
export function getOrCreateCsrfToken(sessionId: string): string {
  const existing = csrfTokenStore.get(sessionId);
  
  if (existing && existing.expires > Date.now()) {
    return existing.token;
  }
  
  const token = generateCsrfToken();
  csrfTokenStore.set(sessionId, {
    token,
    expires: Date.now() + TOKEN_EXPIRY,
  });
  
  return token;
}

/**
 * Validate CSRF token from request
 */
function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);
  
  if (!stored) {
    return false;
  }
  
  if (stored.expires < Date.now()) {
    csrfTokenStore.delete(sessionId);
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
}

/**
 * Extract CSRF token from request
 * Checks multiple locations: header, body, query
 */
function extractCsrfToken(req: Request): string | null {
  // Check header first (recommended)
  if (req.headers['x-csrf-token']) {
    return req.headers['x-csrf-token'] as string;
  }
  
  // Check body
  if (req.body && req.body._csrf) {
    return req.body._csrf;
  }
  
  // Check query parameter (least preferred)
  if (req.query && req.query._csrf) {
    return req.query._csrf as string;
  }
  
  return null;
}

/**
 * Get session ID from request
 * Can be customized based on your session management
 */
function getSessionId(req: Request): string {
  // If using express-session
  if (req.session && req.session.id) {
    return req.session.id;
  }
  
  // If using JWT or other auth
  if (req.user && (req.user as any).id) {
    return (req.user as any).id;
  }
  
  // Fallback to IP + User-Agent (less secure)
  const userAgent = req.headers['user-agent'] || 'unknown';
  return crypto
    .createHash('sha256')
    .update(`${req.ip}-${userAgent}`)
    .digest('hex');
}

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens on state-changing requests (POST, PUT, PATCH, DELETE)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Only check CSRF for state-changing methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  
  if (safeMethods.includes(req.method)) {
    return next();
  }
  
  // Skip CSRF check for API routes with API keys (if applicable)
  if (req.headers['x-api-key']) {
    return next();
  }
  
  const sessionId = getSessionId(req);
  const token = extractCsrfToken(req);
  
  if (!token) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'CSRF token is missing',
      code: 'CSRF_TOKEN_MISSING',
    });
  }
  
  if (!validateCsrfToken(sessionId, token)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    });
  }
  
  next();
}

/**
 * Middleware to generate and attach CSRF token to response
 * Call this on routes that render forms or return initial data
 */
export function attachCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const sessionId = getSessionId(req);
  const token = getOrCreateCsrfToken(sessionId);
  
  // Attach token to response locals for template rendering
  res.locals.csrfToken = token;
  
  // Also send in header for SPA consumption
  res.setHeader('X-CSRF-Token', token);
  
  next();
}

/**
 * Express route handler to get CSRF token
 * Used by frontend applications
 */
export function getCsrfToken(req: Request, res: Response): void {
  const sessionId = getSessionId(req);
  const token = getOrCreateCsrfToken(sessionId);
  
  res.json({
    success: true,
    csrfToken: token,
  });
}

export default {
  csrfProtection,
  attachCsrfToken,
  getCsrfToken,
  generateCsrfToken,
  getOrCreateCsrfToken,
};
