import { PrismaClient, AuditSeverity, ComplianceType } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  complianceType?: ComplianceType;
  severity?: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Loose shape accepted by {@link AuditService.logEvent} for object-style calls.
 * These calls use the pre-migration field names (resourceType / resourceId /
 * riskLevel) which are normalised onto {@link AuditLogData} before persisting.
 */
export interface AuditEventData {
  userId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  riskLevel?: string;
  // Direct AuditLogData-style fields are also accepted for convenience.
  entityType?: string;
  entityId?: string;
  severity?: AuditSeverity;
  complianceType?: ComplianceType;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Normalise a risk level onto the Prisma {@link AuditSeverity} enum.
 * Accepts lowercase (`low`/`medium`/`high`/`critical`) and already-uppercase
 * enum values (`INFO`/`WARNING`/`ERROR`/`CRITICAL`).
 */
function normalizeSeverity(value?: string | null): AuditSeverity | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if (upper === 'LOW') return 'INFO';
  if (upper === 'MEDIUM') return 'WARNING';
  if (upper === 'HIGH') return 'ERROR';
  if (upper === 'CRITICAL') return 'CRITICAL';
  if (upper === 'INFO' || upper === 'WARNING' || upper === 'ERROR') {
    return upper as AuditSeverity;
  }
  return undefined;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  async createAuditLog(data: AuditLogData) {
    try {
      const auditEntry = await prisma.auditEntry.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          details: data.details || {},
          complianceType: data.complianceType,
          severity: data.severity || 'INFO',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
          timestamp: new Date(),
        },
      });

      return auditEntry;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Log an audit event.
   *
   * Supports the two call shapes used across the codebase:
   *  1. Positional: `logEvent(action, entityId, details?)`
   *  2. Object:     `logEvent({ userId, action, resourceType, resourceId, details, riskLevel })`
   *
   * Object-shape calls are normalised onto {@link AuditLogData}
   * (resourceType → entityType, resourceId → entityId, riskLevel → severity).
   * When no entity type is supplied it defaults to `'SYSTEM'`.
   */
  async logEvent(action: string, entityId: string, details?: any): Promise<any>;
  async logEvent(data: AuditEventData): Promise<any>;
  async logEvent(
    actionOrData: string | AuditEventData,
    entityId?: string,
    details?: any
  ): Promise<any> {
    // Shape 1 — positional: logEvent(action, entityId, details?)
    if (typeof actionOrData === 'string') {
      return this.createAuditLog({
        action: actionOrData,
        entityType: 'SYSTEM',
        entityId: entityId ?? '',
        details,
      });
    }

    // Shape 2 — object: normalise the pre-migration field names.
    const data = actionOrData;
    return this.createAuditLog({
      userId: data.userId ?? undefined,
      action: data.action,
      entityType: data.entityType ?? data.resourceType ?? 'SYSTEM',
      entityId: data.entityId ?? data.resourceId ?? '',
      details: data.details,
      complianceType: data.complianceType,
      severity: normalizeSeverity(data.riskLevel) ?? data.severity,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    });
  }

  /**
   * Log user action with request context
   */
  async logUserAction(
    req: Request,
    action: string,
    entityType: string,
    entityId: string,
    details?: any,
    severity: AuditSeverity = 'INFO'
  ) {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const sessionId = req.session?.id || req.headers['x-session-id'] as string;

    return this.createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      details,
      severity,
      ipAddress,
      userAgent,
      sessionId,
    });
  }

  /**
   * Log compliance-related action
   */
  async logComplianceAction(
    req: Request,
    action: string,
    entityType: string,
    entityId: string,
    complianceType: ComplianceType,
    details?: any
  ) {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      details,
      complianceType,
      severity: 'WARNING',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    severity?: AuditSeverity;
    complianceType?: ComplianceType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      userId,
      entityType,
      entityId,
      action,
      severity,
      complianceType,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (severity) where.severity = severity;
    if (complianceType) where.complianceType = complianceType;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditEntry.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditEntry.count({ where }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditTrail(entityType: string, entityId: string, limit = 100) {
    return prisma.auditEntry.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }) {
    const { startDate, endDate, userId } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [
      totalLogs,
      bySeverity,
      byAction,
      byEntityType,
    ] = await Promise.all([
      prisma.auditEntry.count({ where }),
      prisma.auditEntry.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      prisma.auditEntry.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.auditEntry.groupBy({
        by: ['entityType'],
        where,
        _count: true,
        orderBy: { _count: { entityType: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      bySeverity: bySeverity.map(s => ({
        severity: s.severity,
        count: s._count,
      })),
      topActions: byAction.map(a => ({
        action: a.action,
        count: a._count,
      })),
      topEntityTypes: byEntityType.map(e => ({
        entityType: e.entityType,
        count: e._count,
      })),
    };
  }

  /**
   * Delete old audit logs (for cleanup/retention policies)
   */
  async deleteOldLogs(olderThanDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.auditEntry.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return {
      deleted: result.count,
      cutoffDate,
    };
  }
}

export const auditService = new AuditService();
