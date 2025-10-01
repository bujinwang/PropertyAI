import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { AuditSeverity, ComplianceType } from '@prisma/client';

export class AuditController {
  /**
   * Create a new audit log entry
   * POST /api/audit/log
   */
  async createLog(req: Request, res: Response) {
    try {
      const { action, entityType, entityId, details, severity, complianceType } = req.body;

      // Validate required fields
      if (!action || !entityType || !entityId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: action, entityType, entityId',
        });
      }

      const auditEntry = await auditService.logUserAction(
        req,
        action,
        entityType,
        entityId,
        details,
        severity as AuditSeverity
      );

      res.status(201).json({
        success: true,
        data: auditEntry,
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create audit log',
      });
    }
  }

  /**
   * Get audit logs with filters
   * GET /api/audit/logs
   */
  async getLogs(req: Request, res: Response) {
    try {
      const {
        userId,
        entityType,
        entityId,
        action,
        severity,
        complianceType,
        startDate,
        endDate,
        limit,
        offset,
      } = req.query;

      const filters: any = {};

      if (userId) filters.userId = userId as string;
      if (entityType) filters.entityType = entityType as string;
      if (entityId) filters.entityId = entityId as string;
      if (action) filters.action = action as string;
      if (severity) filters.severity = severity as AuditSeverity;
      if (complianceType) filters.complianceType = complianceType as ComplianceType;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await auditService.getAuditLogs(filters);

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
      });
    }
  }

  /**
   * Get audit trail for a specific entity
   * GET /api/audit/trail/:entityType/:entityId
   */
  async getEntityTrail(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const { limit } = req.query;

      const trail = await auditService.getEntityAuditTrail(
        entityType,
        entityId,
        limit ? parseInt(limit as string, 10) : undefined
      );

      res.json({
        success: true,
        data: trail,
      });
    } catch (error) {
      console.error('Error fetching entity audit trail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit trail',
      });
    }
  }

  /**
   * Get audit statistics
   * GET /api/audit/stats
   */
  async getStats(req: Request, res: Response) {
    try {
      const { startDate, endDate, userId } = req.query;

      const filters: any = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (userId) filters.userId = userId as string;

      const stats = await auditService.getAuditStats(filters);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit statistics',
      });
    }
  }

  /**
   * Log compliance action
   * POST /api/audit/compliance
   */
  async logComplianceAction(req: Request, res: Response) {
    try {
      const { action, entityType, entityId, complianceType, details } = req.body;

      if (!action || !entityType || !entityId || !complianceType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: action, entityType, entityId, complianceType',
        });
      }

      const auditEntry = await auditService.logComplianceAction(
        req,
        action,
        entityType,
        entityId,
        complianceType as ComplianceType,
        details
      );

      res.status(201).json({
        success: true,
        data: auditEntry,
      });
    } catch (error) {
      console.error('Error logging compliance action:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to log compliance action',
      });
    }
  }
}

export const auditController = new AuditController();
