import { PrismaClient, AuditEntry, ComplianceType, AuditSeverity } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditEvent {
  userId?: string;
  action: string;
  details?: any;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  complianceType?: ComplianceType;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  complianceType?: ComplianceType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByComplianceType: Record<string, number>;
  recentEvents: AuditEntry[];
  suspiciousActivities: AuditEntry[];
}

export class EnhancedAuditService {
  async logEvent(event: AuditEvent): Promise<AuditEntry> {
    const auditEntry = await prisma.auditEntry.create({
      data: {
        userId: event.userId,
        action: event.action,
        details: event.details || {},
        entityType: event.entityType,
        entityId: event.entityId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        sessionId: event.sessionId,
        complianceType: event.complianceType,
        severity: event.severity || 'INFO',
      }
    });

    // Check for suspicious activity
    await this.detectSuspiciousActivity(auditEntry);

    return auditEntry;
  }

  async queryEvents(query: AuditQuery): Promise<AuditEntry[]> {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.complianceType) where.complianceType = query.complianceType;
    if (query.severity) where.severity = query.severity;
    if (query.ipAddress) where.ipAddress = query.ipAddress;

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }

    return prisma.auditEntry.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: query.limit || 100,
      skip: query.offset || 0,
    });
  }

  async getAuditStats(timeRange?: { start: Date; end: Date }): Promise<AuditStats> {
    const where: any = {};
    if (timeRange) {
      where.timestamp = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const [totalEvents, eventsByAction, eventsBySeverity, eventsByComplianceType, recentEvents, suspiciousActivities] = await Promise.all([
      prisma.auditEntry.count({ where }),
      prisma.auditEntry.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      prisma.auditEntry.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true },
      }),
      prisma.auditEntry.groupBy({
        by: ['complianceType'],
        where,
        _count: { complianceType: true },
      }),
      prisma.auditEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
      this.getSuspiciousActivities(timeRange),
    ]);

    return {
      totalEvents,
      eventsByAction: Object.fromEntries(
        eventsByAction.map(item => [item.action, item._count.action])
      ),
      eventsBySeverity: Object.fromEntries(
        eventsBySeverity.map(item => [item.severity, item._count.severity])
      ),
      eventsByComplianceType: Object.fromEntries(
        eventsByComplianceType
          .filter(item => item.complianceType)
          .map(item => [item.complianceType!, item._count.complianceType])
      ),
      recentEvents,
      suspiciousActivities,
    };
  }

  async exportAuditLog(query: AuditQuery, format: 'json' | 'csv' | 'xml' = 'json'): Promise<string> {
    const events = await this.queryEvents({ ...query, limit: 10000 }); // Limit to 10k for export

    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2);

      case 'csv':
        return this.convertToCSV(events);

      case 'xml':
        return this.convertToXML(events);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async getComplianceReport(complianceType: ComplianceType, timeRange: { start: Date; end: Date }): Promise<any> {
    const events = await this.queryEvents({
      complianceType,
      startDate: timeRange.start,
      endDate: timeRange.end,
    });

    // Generate compliance-specific report
    switch (complianceType) {
      case 'GDPR':
        return this.generateGDPRReport(events, timeRange);
      case 'CCPA':
        return this.generateCCPAReport(events, timeRange);
      case 'SOX':
        return this.generateSOXReport(events, timeRange);
      default:
        return {
          complianceType,
          timeRange,
          totalEvents: events.length,
          events,
        };
    }
  }

  private async detectSuspiciousActivity(entry: AuditEntry): Promise<void> {
    const suspiciousPatterns = [
      { action: 'LOGIN_FAILED', threshold: 5, timeWindow: 15 * 60 * 1000 }, // 5 failed logins in 15 minutes
      { action: 'PASSWORD_RESET', threshold: 3, timeWindow: 60 * 60 * 1000 }, // 3 password resets in 1 hour
      { severity: 'ERROR', threshold: 10, timeWindow: 60 * 60 * 1000 }, // 10 errors in 1 hour
    ];

    for (const pattern of suspiciousPatterns) {
      const isMatch = this.matchesSuspiciousPattern(entry, pattern);
      if (isMatch) {
        await this.createSecurityIncident(entry, pattern);
        break;
      }
    }
  }

  private matchesSuspiciousPattern(entry: AuditEntry, pattern: any): boolean {
    // This would check if the entry matches suspicious patterns
    // Implementation depends on specific security rules
    return false; // Placeholder
  }

  private async createSecurityIncident(entry: AuditEntry, pattern: any): Promise<void> {
    await prisma.securityIncident.create({
      data: {
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        description: `Suspicious activity detected: ${pattern.action || pattern.severity}`,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        details: {
          auditEntryId: entry.id,
          pattern,
          timestamp: entry.timestamp,
        },
      }
    });
  }

  private async getSuspiciousActivities(timeRange?: { start: Date; end: Date }): Promise<AuditEntry[]> {
    const where: any = {
      OR: [
        { severity: 'ERROR' },
        { severity: 'CRITICAL' },
        { action: 'LOGIN_FAILED' },
        { action: 'ACCOUNT_LOCKED' },
      ]
    };

    if (timeRange) {
      where.timestamp = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    return prisma.auditEntry.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  private convertToCSV(events: AuditEntry[]): string {
    const headers = ['timestamp', 'userId', 'action', 'entityType', 'entityId', 'ipAddress', 'userAgent', 'severity'];
    const rows = events.map(event => [
      event.timestamp.toISOString(),
      event.userId || '',
      event.action,
      event.entityType,
      event.entityId,
      event.ipAddress || '',
      event.userAgent || '',
      event.severity,
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  }

  private convertToXML(events: AuditEntry[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditLog>\n';

    for (const event of events) {
      xml += '  <entry>\n';
      xml += `    <timestamp>${event.timestamp.toISOString()}</timestamp>\n`;
      if (event.userId) xml += `    <userId>${event.userId}</userId>\n`;
      xml += `    <action>${event.action}</action>\n`;
      xml += `    <entityType>${event.entityType}</entityType>\n`;
      xml += `    <entityId>${event.entityId}</entityId>\n`;
      if (event.ipAddress) xml += `    <ipAddress>${event.ipAddress}</ipAddress>\n`;
      if (event.userAgent) xml += `    <userAgent>${event.userAgent}</userAgent>\n`;
      xml += `    <severity>${event.severity}</severity>\n`;
      xml += '  </entry>\n';
    }

    xml += '</auditLog>';
    return xml;
  }

  private generateGDPRReport(events: AuditEntry[], timeRange: { start: Date; end: Date }): any {
    const dataAccessEvents = events.filter(e => e.action.includes('DATA_ACCESS'));
    const dataErasureEvents = events.filter(e => e.action.includes('DATA_ERASURE'));
    const consentEvents = events.filter(e => e.action.includes('CONSENT'));

    return {
      complianceType: 'GDPR',
      timeRange,
      summary: {
        totalDataAccessRequests: dataAccessEvents.length,
        totalDataErasureRequests: dataErasureEvents.length,
        totalConsentChanges: consentEvents.length,
      },
      dataAccessRequests: dataAccessEvents,
      dataErasureRequests: dataErasureEvents,
      consentChanges: consentEvents,
    };
  }

  private generateCCPAReport(events: AuditEntry[], timeRange: { start: Date; end: Date }): any {
    const dataRequests = events.filter(e => e.action.includes('DATA_REQUEST'));
    const optOutEvents = events.filter(e => e.action.includes('OPT_OUT'));

    return {
      complianceType: 'CCPA',
      timeRange,
      summary: {
        totalDataRequests: dataRequests.length,
        totalOptOuts: optOutEvents.length,
      },
      dataRequests,
      optOutEvents,
    };
  }

  private generateSOXReport(events: AuditEntry[], timeRange: { start: Date; end: Date }): any {
    const financialEvents = events.filter(e => e.entityType === 'TRANSACTION' || e.action.includes('FINANCIAL'));
    const accessEvents = events.filter(e => e.action.includes('ACCESS') && e.entityType === 'FINANCIAL');

    return {
      complianceType: 'SOX',
      timeRange,
      summary: {
        totalFinancialEvents: financialEvents.length,
        totalFinancialAccessEvents: accessEvents.length,
      },
      financialEvents,
      accessEvents,
    };
  }
}

export const enhancedAuditService = new EnhancedAuditService();