import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { AuditSeverity } from '@prisma/client';

/**
 * Middleware to automatically log API requests
 */
export const auditMiddleware = (options: {
  action?: string;
  entityType: string;
  getEntityId: (req: Request) => string;
  severity?: AuditSeverity;
  includeBody?: boolean;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, entityType, getEntityId, severity = 'INFO', includeBody = false } = options;

      // Determine action from request method if not specified
      const auditAction = action || `${req.method} ${entityType}`;
      
      // Get entity ID from request
      const entityId = getEntityId(req);

      // Prepare details
      const details: any = {
        method: req.method,
        path: req.path,
        query: req.query,
      };

      if (includeBody && req.body) {
        details.body = req.body;
      }

      // Log the action
      await auditService.logUserAction(
        req,
        auditAction,
        entityType,
        entityId,
        details,
        severity
      );

      next();
    } catch (error) {
      console.error('Error in audit middleware:', error);
      // Don't block the request if audit logging fails
      next();
    }
  };
};

/**
 * Middleware to log response after request completion
 */
export const auditResponseMiddleware = (options: {
  action: string;
  entityType: string;
  getEntityId: (req: Request) => string;
  severity?: AuditSeverity;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { action, entityType, getEntityId, severity = 'INFO' } = options;

    // Store original send function
    const originalSend = res.send;

    // Override send function to capture response
    res.send = function (data: any) {
      // Restore original send
      res.send = originalSend;

      // Log the action with response details
      const entityId = getEntityId(req);
      
      auditService.logUserAction(
        req,
        action,
        entityType,
        entityId,
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
        },
        severity
      ).catch(error => {
        console.error('Error logging audit response:', error);
      });

      // Send the response
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Pre-configured audit middleware for common entity types
 */
export const auditMiddlewares = {
  /**
   * Audit middleware for property operations
   */
  property: (action?: string) => auditMiddleware({
    action,
    entityType: 'PROPERTY',
    getEntityId: (req) => req.params.propertyId || req.params.id || req.body.propertyId || 'unknown',
  }),

  /**
   * Audit middleware for user operations
   */
  user: (action?: string) => auditMiddleware({
    action,
    entityType: 'USER',
    getEntityId: (req) => req.params.userId || req.params.id || req.user?.id || 'unknown',
  }),

  /**
   * Audit middleware for maintenance operations
   */
  maintenance: (action?: string) => auditMiddleware({
    action,
    entityType: 'MAINTENANCE',
    getEntityId: (req) => req.params.requestId || req.params.id || req.body.requestId || 'unknown',
  }),

  /**
   * Audit middleware for payment operations
   */
  payment: (action?: string) => auditMiddleware({
    action,
    entityType: 'PAYMENT',
    getEntityId: (req) => req.params.paymentId || req.params.id || req.body.paymentId || 'unknown',
    severity: 'WARNING',
  }),

  /**
   * Audit middleware for lease operations
   */
  lease: (action?: string) => auditMiddleware({
    action,
    entityType: 'LEASE',
    getEntityId: (req) => req.params.leaseId || req.params.id || req.body.leaseId || 'unknown',
  }),

  /**
   * Audit middleware for document operations
   */
  document: (action?: string) => auditMiddleware({
    action,
    entityType: 'DOCUMENT',
    getEntityId: (req) => req.params.documentId || req.params.id || req.body.documentId || 'unknown',
  }),
};
