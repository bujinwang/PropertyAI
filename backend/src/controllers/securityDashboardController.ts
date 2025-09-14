import { Request, Response, NextFunction } from 'express';
import { enhancedAuditService, AuditQuery } from '../services/enhancedAuditService';
import { complianceService } from '../services/complianceService';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { AppError } from '../middleware/errorMiddleware';

export const getSecurityOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const timeRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    } : undefined;

    const [auditStats, violations, activeUsers, failedLogins] = await Promise.all([
      enhancedAuditService.getAuditStats(timeRange),
      complianceService.detectComplianceViolations(),
      getActiveUsersCount(),
      getFailedLoginAttempts(timeRange),
    ]);

    res.json({
      data: {
        auditStats,
        complianceViolations: violations,
        activeUsers,
        failedLogins,
        securityScore: calculateSecurityScore(auditStats, violations),
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuthenticationMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const timeRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    } : undefined;

    const [loginAttempts, mfaUsage, biometricUsage, ssoUsage] = await Promise.all([
      getLoginMetrics(timeRange),
      getMFAMetrics(timeRange),
      getBiometricMetrics(timeRange),
      getSSOMetrics(timeRange),
    ]);

    res.json({
      data: {
        loginAttempts,
        mfaUsage,
        biometricUsage,
        ssoUsage,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSecurityIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, severity, limit = 50 } = req.query;

    const incidents = await getSecurityIncidentsData({
      status: status as string,
      type: type as string,
      severity: severity as string,
      limit: parseInt(limit as string),
    });

    res.json({ data: incidents });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      complianceType,
      severity,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    const query: AuditQuery = {
      userId: userId as string,
      action: action as string,
      entityType: entityType as string,
      entityId: entityId as string,
      complianceType: complianceType as any,
      severity: severity as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const events = await enhancedAuditService.queryEvents(query);

    res.json({ data: events });
  } catch (error) {
    next(error);
  }
};

export const exportAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { format = 'json' } = req.query;
    const query: AuditQuery = req.body; // Full query from request body

    const exportData = await enhancedAuditService.exportAuditLog(query, format as 'json' | 'csv' | 'xml');

    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml',
    };

    res.setHeader('Content-Type', mimeTypes[format as keyof typeof mimeTypes]);
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs.${format}`);

    res.send(exportData);
  } catch (error) {
    next(error);
  }
};

export const getComplianceReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, startDate, endDate } = req.query;

    if (!type || !startDate || !endDate) {
      throw new AppError('Type, startDate, and endDate are required', 400);
    }

    const timeRange = {
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    };

    let report;
    switch (type) {
      case 'GDPR':
        report = await complianceService.generateGDPRComplianceReport(timeRange);
        break;
      case 'CCPA':
        report = await complianceService.generateCCPAComplianceReport(timeRange);
        break;
      case 'SOX':
        report = await complianceService.generateSOXComplianceReport(timeRange);
        break;
      default:
        throw new AppError(`Unsupported compliance report type: ${type}`, 400);
    }

    res.json({ data: report });
  } catch (error) {
    next(error);
  }
};

export const getUserSecurityProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const [user, sessions, biometricCredentials, securitySettings] = await Promise.all([
      getUserSecurityInfo(userId),
      enhancedAuthService.getActiveSessions(userId),
      getUserBiometricCredentials(userId),
      enhancedAuthService.getSecuritySettings(userId),
    ]);

    res.json({
      data: {
        user,
        sessions,
        biometricCredentials,
        securitySettings,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSecurityAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await generateSecurityAlerts();

    res.json({ data: alerts });
  } catch (error) {
    next(error);
  }
};

// Helper functions
async function getActiveUsersCount(): Promise<number> {
  // This would need to be implemented based on your user activity tracking
  return 0; // Placeholder
}

async function getFailedLoginAttempts(timeRange?: { start: Date; end: Date }): Promise<any[]> {
  const query: AuditQuery = {
    action: 'LOGIN_FAILED',
    startDate: timeRange?.start,
    endDate: timeRange?.end,
    limit: 100,
  };

  return enhancedAuditService.queryEvents(query);
}

function calculateSecurityScore(auditStats: any, violations: any[]): number {
  let score = 100;

  // Deduct points for violations
  score -= violations.length * 10;

  // Deduct points for failed logins
  const failedLoginRatio = auditStats.eventsByAction?.LOGIN_FAILED || 0;
  score -= Math.min(failedLoginRatio * 5, 30);

  // Deduct points for suspicious activities
  const suspiciousCount = auditStats.suspiciousActivities?.length || 0;
  score -= suspiciousCount * 2;

  return Math.max(0, Math.min(100, score));
}

async function getLoginMetrics(timeRange?: { start: Date; end: Date }): Promise<any> {
  const [successful, failed] = await Promise.all([
    enhancedAuditService.queryEvents({
      action: 'LOGIN_SUCCESS',
      startDate: timeRange?.start,
      endDate: timeRange?.end,
    }),
    enhancedAuditService.queryEvents({
      action: 'LOGIN_FAILED',
      startDate: timeRange?.start,
      endDate: timeRange?.end,
    }),
  ]);

  return {
    successful: successful.length,
    failed: failed.length,
    total: successful.length + failed.length,
    successRate: successful.length + failed.length > 0
      ? (successful.length / (successful.length + failed.length)) * 100
      : 0,
  };
}

async function getMFAMetrics(timeRange?: { start: Date; end: Date }): Promise<any> {
  const mfaEvents = await enhancedAuditService.queryEvents({
    action: 'MFA_VERIFIED',
    startDate: timeRange?.start,
    endDate: timeRange?.end,
  });

  return {
    totalVerifications: mfaEvents.length,
    uniqueUsers: new Set(mfaEvents.map(e => e.userId)).size,
  };
}

async function getBiometricMetrics(timeRange?: { start: Date; end: Date }): Promise<any> {
  const biometricEvents = await enhancedAuditService.queryEvents({
    action: 'BIOMETRIC_LOGIN_SUCCESS',
    startDate: timeRange?.start,
    endDate: timeRange?.end,
  });

  return {
    totalAuthentications: biometricEvents.length,
    uniqueUsers: new Set(biometricEvents.map(e => e.userId)).size,
  };
}

async function getSSOMetrics(timeRange?: { start: Date; end: Date }): Promise<any> {
  const ssoEvents = await enhancedAuditService.queryEvents({
    action: 'SSO_LOGIN',
    startDate: timeRange?.start,
    endDate: timeRange?.end,
  });

  return {
    totalAuthentications: ssoEvents.length,
    uniqueUsers: new Set(ssoEvents.map(e => e.userId)).size,
    providers: ssoEvents.reduce((acc, event) => {
      const provider = event.details?.provider || 'unknown';
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

async function getSecurityIncidentsData(filters: any): Promise<any[]> {
  // This would query the SecurityIncident model
  return []; // Placeholder
}

async function getUserSecurityInfo(userId: string): Promise<any> {
  // This would fetch comprehensive user security information
  return {}; // Placeholder
}

async function getUserBiometricCredentials(userId: string): Promise<any[]> {
  // This would fetch user's biometric credentials
  return []; // Placeholder
}

async function generateSecurityAlerts(): Promise<any[]> {
  const violations = await complianceService.detectComplianceViolations();

  return violations.map(violation => ({
    id: `alert-${Date.now()}-${Math.random()}`,
    type: 'compliance',
    severity: violation.severity,
    title: violation.type.replace(/_/g, ' '),
    description: violation.description,
    timestamp: new Date(),
    details: violation.details,
  }));
}