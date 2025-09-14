import { PrismaClient, ComplianceType, ComplianceRegion } from '@prisma/client';
import { enhancedAuditService } from './enhancedAuditService';
import { AppError } from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export interface DataAccessRequest {
  userId: string;
  requestType: 'access' | 'portability' | 'erasure' | 'rectification';
  reason?: string;
  requestedData?: string[];
}

export interface ComplianceReport {
  id: string;
  type: ComplianceType;
  generatedAt: Date;
  validUntil: Date;
  data: any;
  checksum: string;
}

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  autoDelete: boolean;
  lastCleanup?: Date;
}

export class ComplianceService {
  private readonly DEFAULT_RETENTION_PERIODS = {
    user_data: 2555, // 7 years
    audit_logs: 2555,
    financial_data: 2555,
    session_data: 90, // 90 days
    temporary_files: 30, // 30 days
  };

  async createDataAccessRequest(request: DataAccessRequest): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: request.userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Create audit entry
    await enhancedAuditService.logEvent({
      userId: request.userId,
      action: `DATA_${request.requestType.toUpperCase()}_REQUEST`,
      details: {
        requestType: request.requestType,
        reason: request.reason,
        requestedData: request.requestedData,
      },
      entityType: 'USER',
      entityId: request.userId,
      complianceType: user.complianceRegion === 'GDPR' ? 'GDPR' : 'GENERAL',
    });

    // For GDPR/CCPA compliance, we need to respond within 30 days
    const responseDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      requestId: `DAR-${Date.now()}`,
      userId: request.userId,
      requestType: request.requestType,
      status: 'pending',
      submittedAt: new Date(),
      responseDeadline,
    };
  }

  async processDataAccessRequest(requestId: string, approved: boolean, processedBy: string): Promise<void> {
    // In a real implementation, you'd store and track these requests
    // For now, we'll just log the processing

    await enhancedAuditService.logEvent({
      userId: processedBy,
      action: approved ? 'DATA_ACCESS_APPROVED' : 'DATA_ACCESS_DENIED',
      details: { requestId },
      entityType: 'COMPLIANCE',
      entityId: requestId,
      complianceType: 'GDPR',
    });
  }

  async generateGDPRComplianceReport(timeRange: { start: Date; end: Date }): Promise<ComplianceReport> {
    const auditData = await enhancedAuditService.getComplianceReport('GDPR', timeRange);

    const report = {
      id: `GDPR-${Date.now()}`,
      type: 'GDPR' as ComplianceType,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      data: {
        ...auditData,
        dataProcessingActivities: await this.getDataProcessingActivities(timeRange),
        dataSubjectRights: await this.getDataSubjectRights(timeRange),
        dataBreachIncidents: await this.getDataBreachIncidents(timeRange),
      },
    };

    // Generate checksum for integrity
    report.checksum = this.generateChecksum(JSON.stringify(report.data));

    // Store report
    await prisma.complianceReport.create({
      data: {
        type: 'GDPR',
        reportData: report.data,
        generatedById: 'system', // Would be actual user ID
        validUntil: report.validUntil,
        checksum: report.checksum,
      }
    });

    return report;
  }

  async generateCCPAComplianceReport(timeRange: { start: Date; end: Date }): Promise<ComplianceReport> {
    const auditData = await enhancedAuditService.getComplianceReport('CCPA', timeRange);

    const report = {
      id: `CCPA-${Date.now()}`,
      type: 'CCPA' as ComplianceType,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      data: {
        ...auditData,
        dataSales: await this.getDataSalesActivities(timeRange),
        optOutRequests: await this.getOptOutRequests(timeRange),
        californiaResidents: await this.getCaliforniaResidentsCount(),
      },
    };

    report.checksum = this.generateChecksum(JSON.stringify(report.data));

    await prisma.complianceReport.create({
      data: {
        type: 'CCPA',
        reportData: report.data,
        generatedById: 'system',
        validUntil: report.validUntil,
        checksum: report.checksum,
      }
    });

    return report;
  }

  async generateSOXComplianceReport(timeRange: { start: Date; end: Date }): Promise<ComplianceReport> {
    const auditData = await enhancedAuditService.getComplianceReport('SOX', timeRange);

    const report = {
      id: `SOX-${Date.now()}`,
      type: 'SOX' as ComplianceType,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      data: {
        ...auditData,
        financialControls: await this.getFinancialControls(timeRange),
        accessLogs: await this.getFinancialAccessLogs(timeRange),
        segregationOfDuties: await this.checkSegregationOfDuties(),
      },
    };

    report.checksum = this.generateChecksum(JSON.stringify(report.data));

    await prisma.complianceReport.create({
      data: {
        type: 'SOX',
        reportData: report.data,
        generatedById: 'system',
        validUntil: report.validUntil,
        checksum: report.checksum,
      }
    });

    return report;
  }

  async getDataRetentionPolicies(): Promise<RetentionPolicy[]> {
    const policies = await prisma.dataRetentionPolicy.findMany({
      where: { isActive: true }
    });

    return policies.map(policy => ({
      dataType: policy.dataType,
      retentionPeriod: policy.retentionPeriod,
      autoDelete: policy.autoDelete,
      lastCleanup: policy.updatedAt,
    }));
  }

  async updateDataRetentionPolicy(dataType: string, retentionPeriod: number, autoDelete: boolean): Promise<void> {
    await prisma.dataRetentionPolicy.upsert({
      where: { id: `${dataType}_policy` }, // Simple ID generation
      update: {
        retentionPeriod,
        autoDelete,
        updatedAt: new Date(),
      },
      create: {
        id: `${dataType}_policy`,
        name: `${dataType} Retention Policy`,
        description: `Automatic data retention policy for ${dataType}`,
        dataType,
        retentionPeriod,
        autoDelete,
        complianceType: 'GENERAL',
      }
    });
  }

  async executeDataRetentionCleanup(dataType: string): Promise<{ deletedCount: number }> {
    const policy = await prisma.dataRetentionPolicy.findFirst({
      where: { dataType, isActive: true }
    });

    if (!policy || !policy.autoDelete) {
      return { deletedCount: 0 };
    }

    const cutoffDate = new Date(Date.now() - policy.retentionPeriod * 24 * 60 * 60 * 1000);

    let deletedCount = 0;

    switch (dataType) {
      case 'audit_logs': {
        const result = await prisma.auditEntry.deleteMany({
          where: {
            timestamp: { lt: cutoffDate },
            severity: 'INFO', // Only delete info-level logs
          }
        });
        deletedCount = result.count;
        break;
      }

      case 'session_data': {
        const sessionResult = await prisma.session.deleteMany({
          where: { createdAt: { lt: cutoffDate } }
        });
        deletedCount = sessionResult.count;
        break;
      }

      // Add more data types as needed
    }

    // Update last cleanup
    await prisma.dataRetentionPolicy.update({
      where: { id: policy.id },
      data: { updatedAt: new Date() }
    });

    await enhancedAuditService.logEvent({
      action: 'DATA_RETENTION_CLEANUP',
      details: {
        dataType,
        deletedCount,
        cutoffDate,
      },
      entityType: 'SYSTEM',
      entityId: 'data-retention',
      complianceType: 'GENERAL',
    });

    return { deletedCount };
  }

  async detectComplianceViolations(): Promise<any[]> {
    const violations = [];

    // Check for overdue data access requests (GDPR requirement: respond within 30 days)
    const overdueRequests = await this.getOverdueDataRequests();
    if (overdueRequests.length > 0) {
      violations.push({
        type: 'OVERDUE_DATA_REQUESTS',
        severity: 'HIGH',
        description: `${overdueRequests.length} data access requests are overdue`,
        details: overdueRequests,
      });
    }

    // Check for missing data retention policies
    const missingPolicies = await this.getMissingRetentionPolicies();
    if (missingPolicies.length > 0) {
      violations.push({
        type: 'MISSING_RETENTION_POLICIES',
        severity: 'MEDIUM',
        description: `Missing retention policies for: ${missingPolicies.join(', ')}`,
        details: missingPolicies,
      });
    }

    // Check for unauthorized financial data access
    const unauthorizedAccess = await this.detectUnauthorizedFinancialAccess();
    if (unauthorizedAccess.length > 0) {
      violations.push({
        type: 'UNAUTHORIZED_FINANCIAL_ACCESS',
        severity: 'CRITICAL',
        description: `${unauthorizedAccess.length} instances of unauthorized financial data access`,
        details: unauthorizedAccess,
      });
    }

    return violations;
  }

  private async getDataProcessingActivities(timeRange: { start: Date; end: Date }): Promise<any[]> {
    // Get all data processing activities from audit logs
    const activities = await enhancedAuditService.queryEvents({
      startDate: timeRange.start,
      endDate: timeRange.end,
      action: 'DATA_PROCESSING',
    });

    return activities.map(activity => ({
      purpose: activity.details?.purpose,
      dataCategories: activity.details?.dataCategories,
      recipients: activity.details?.recipients,
      timestamp: activity.timestamp,
    }));
  }

  private async getDataSubjectRights(timeRange: { start: Date; end: Date }): Promise<any> {
    const [accessRequests, erasureRequests, rectificationRequests] = await Promise.all([
      enhancedAuditService.queryEvents({
        startDate: timeRange.start,
        endDate: timeRange.end,
        action: 'DATA_ACCESS_REQUEST',
      }),
      enhancedAuditService.queryEvents({
        startDate: timeRange.start,
        endDate: timeRange.end,
        action: 'DATA_ERASURE_REQUEST',
      }),
      enhancedAuditService.queryEvents({
        startDate: timeRange.start,
        endDate: timeRange.end,
        action: 'DATA_RECTIFICATION_REQUEST',
      }),
    ]);

    return {
      accessRequests: accessRequests.length,
      erasureRequests: erasureRequests.length,
      rectificationRequests: rectificationRequests.length,
      totalRequests: accessRequests.length + erasureRequests.length + rectificationRequests.length,
    };
  }

  private async getDataBreachIncidents(timeRange: { start: Date; end: Date }): Promise<any[]> {
    const incidents = await prisma.securityIncident.findMany({
      where: {
        type: 'DATA_BREACH',
        detectedAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
    });

    return incidents.map(incident => ({
      id: incident.id,
      severity: incident.severity,
      description: incident.description,
      detectedAt: incident.detectedAt,
      resolvedAt: incident.resolvedAt,
      affectedUsers: incident.details?.affectedUsers,
    }));
  }

  private async getDataSalesActivities(timeRange: { start: Date; end: Date }): Promise<any[]> {
    // CCPA requires tracking data sales
    const sales = await enhancedAuditService.queryEvents({
      startDate: timeRange.start,
      endDate: timeRange.end,
      action: 'DATA_SALE',
    });

    return sales.map(sale => ({
      recipient: sale.details?.recipient,
      dataCategories: sale.details?.dataCategories,
      timestamp: sale.timestamp,
    }));
  }

  private async getOptOutRequests(timeRange: { start: Date; end: Date }): Promise<any[]> {
    const optOuts = await enhancedAuditService.queryEvents({
      startDate: timeRange.start,
      endDate: timeRange.end,
      action: 'OPT_OUT_REQUEST',
    });

    return optOuts.map(optOut => ({
      userId: optOut.userId,
      reason: optOut.details?.reason,
      timestamp: optOut.timestamp,
    }));
  }

  private async getCaliforniaResidentsCount(): Promise<number> {
    // This would need actual location data
    // For now, return a placeholder
    return 0;
  }

  private async getFinancialControls(timeRange: { start: Date; end: Date }): Promise<any> {
    const controls = await enhancedAuditService.queryEvents({
      startDate: timeRange.start,
      endDate: timeRange.end,
      entityType: 'FINANCIAL_CONTROL',
    });

    return {
      totalControls: controls.length,
      activeControls: controls.filter(c => c.details?.status === 'active').length,
      failedControls: controls.filter(c => c.details?.status === 'failed').length,
    };
  }

  private async getFinancialAccessLogs(timeRange: { start: Date; end: Date }): Promise<any[]> {
    const accesses = await enhancedAuditService.queryEvents({
      startDate: timeRange.start,
      endDate: timeRange.end,
      entityType: 'TRANSACTION',
      action: 'ACCESS',
    });

    return accesses.map(access => ({
      userId: access.userId,
      timestamp: access.timestamp,
      ipAddress: access.ipAddress,
      action: access.action,
    }));
  }

  private async checkSegregationOfDuties(): Promise<any> {
    // Check if users have conflicting roles
    const users = await prisma.user.findMany({
      include: { Role: true }
    });

    const conflicts = users.filter(user => {
      const roles = user.Role.map(r => r.name);
      // Check for conflicting role combinations
      return roles.includes('ADMIN') && roles.includes('TENANT');
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflictingUsers: conflicts.length,
      details: conflicts.map(u => ({ id: u.id, roles: u.Role.map(r => r.name) })),
    };
  }

  private async getOverdueDataRequests(): Promise<any[]> {
    // Placeholder - would need to track actual requests
    return [];
  }

  private async getMissingRetentionPolicies(): Promise<string[]> {
    const existingPolicies = await prisma.dataRetentionPolicy.findMany({
      select: { dataType: true }
    });

    const existingTypes = existingPolicies.map(p => p.dataType);
    const requiredTypes = Object.keys(this.DEFAULT_RETENTION_PERIODS);

    return requiredTypes.filter(type => !existingTypes.includes(type));
  }

  private async detectUnauthorizedFinancialAccess(): Promise<any[]> {
    // Check for access to financial data by unauthorized users
    const accesses = await enhancedAuditService.queryEvents({
      entityType: 'TRANSACTION',
      action: 'ACCESS',
    });

    const unauthorized = accesses.filter(access => {
      // Check if user has financial access permissions
      // This would need actual permission checking logic
      return false; // Placeholder
    });

    return unauthorized;
  }

  private generateChecksum(data: string): string {
    return require('crypto').createHash('sha256').update(data).digest('hex');
  }
}

export const complianceService = new ComplianceService();