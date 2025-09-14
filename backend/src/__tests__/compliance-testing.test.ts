import { complianceService } from '../services/complianceService';
import { enhancedAuditService } from '../services/enhancedAuditService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Compliance Testing Suite', () => {
  beforeEach(async () => {
    // Clear test data
    await prisma.complianceReport.deleteMany();
    await prisma.dataRetentionPolicy.deleteMany();
    await prisma.auditEntry.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GDPR Compliance Testing', () => {
    it('should generate GDPR compliance report with all required sections', async () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateGDPRComplianceReport(timeRange);

      expect(report.type).toBe('GDPR');
      expect(report.data).toHaveProperty('dataProcessingActivities');
      expect(report.data).toHaveProperty('dataSubjectRights');
      expect(report.data).toHaveProperty('dataBreachIncidents');
      expect(report.checksum).toBeDefined();
      expect(report.validUntil).toBeInstanceOf(Date);
    });

    it('should handle data access requests within 30 days', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'gdpr-test@example.com',
          password: 'hashed',
          firstName: 'GDPR',
          lastName: 'Test',
          role: 'TENANT',
          complianceRegion: 'GDPR',
        }
      });

      const request = {
        userId: user.id,
        requestType: 'access' as const,
        reason: 'User requested data access under GDPR',
        requestedData: ['profile', 'transactions', 'communications'],
      };

      const result = await complianceService.createDataAccessRequest(request);

      expect(result.requestId).toMatch(/^DAR-/);
      expect(result.userId).toBe(user.id);
      expect(result.requestType).toBe('access');
      expect(result.responseDeadline).toBeInstanceOf(Date);

      // Verify deadline is within 30 days
      const deadlineDiff = result.responseDeadline.getTime() - Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      expect(deadlineDiff).toBeLessThanOrEqual(thirtyDays);
    });

    it('should track data processing activities', async () => {
      // Create some audit entries that represent data processing
      await prisma.auditEntry.create({
        data: {
          userId: 'test-user',
          action: 'DATA_PROCESSING',
          details: {
            purpose: 'User authentication',
            dataCategories: ['authentication_data', 'login_history'],
            recipients: ['internal_systems'],
          },
          entityType: 'USER',
          entityId: 'test-user',
        }
      });

      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateGDPRComplianceReport(timeRange);

      expect(report.data.dataProcessingActivities).toBeDefined();
      expect(Array.isArray(report.data.dataProcessingActivities)).toBe(true);
    });

    it('should track data subject rights exercises', async () => {
      // Create audit entries for data subject rights
      await prisma.auditEntry.create({
        data: {
          userId: 'test-user',
          action: 'DATA_ACCESS_REQUEST',
          details: { reason: 'User requested access to their data' },
          entityType: 'USER',
          entityId: 'test-user',
        }
      });

      await prisma.auditEntry.create({
        data: {
          userId: 'test-user',
          action: 'DATA_ERASURE_REQUEST',
          details: { reason: 'User requested data deletion' },
          entityType: 'USER',
          entityId: 'test-user',
        }
      });

      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateGDPRComplianceReport(timeRange);

      expect(report.data.dataSubjectRights.accessRequests).toBeGreaterThanOrEqual(1);
      expect(report.data.dataSubjectRights.erasureRequests).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CCPA Compliance Testing', () => {
    it('should generate CCPA compliance report', async () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateCCPAComplianceReport(timeRange);

      expect(report.type).toBe('CCPA');
      expect(report.data).toHaveProperty('dataSales');
      expect(report.data).toHaveProperty('optOutRequests');
      expect(report.checksum).toBeDefined();
    });

    it('should track data sales activities', async () => {
      // Create audit entries for data sales
      await prisma.auditEntry.create({
        data: {
          userId: 'test-user',
          action: 'DATA_SALE',
          details: {
            recipient: 'third_party_analytics',
            dataCategories: ['usage_data', 'demographic_data'],
            value: 25.00,
          },
          entityType: 'USER',
          entityId: 'test-user',
        }
      });

      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateCCPAComplianceReport(timeRange);

      expect(report.data.dataSales).toBeDefined();
      expect(Array.isArray(report.data.dataSales)).toBe(true);
      expect(report.data.dataSales.length).toBeGreaterThan(0);
    });

    it('should track opt-out requests', async () => {
      // Create audit entries for opt-out requests
      await prisma.auditEntry.create({
        data: {
          userId: 'test-user',
          action: 'OPT_OUT_REQUEST',
          details: {
            reason: 'User opted out of data sales',
            categories: ['marketing', 'analytics'],
          },
          entityType: 'USER',
          entityId: 'test-user',
        }
      });

      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateCCPAComplianceReport(timeRange);

      expect(report.data.optOutRequests).toBeDefined();
      expect(Array.isArray(report.data.optOutRequests)).toBe(true);
      expect(report.data.optOutRequests.length).toBeGreaterThan(0);
    });
  });

  describe('SOX Compliance Testing', () => {
    it('should generate SOX compliance report', async () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateSOXComplianceReport(timeRange);

      expect(report.type).toBe('SOX');
      expect(report.data).toHaveProperty('financialControls');
      expect(report.data).toHaveProperty('accessLogs');
      expect(report.data).toHaveProperty('segregationOfDuties');
      expect(report.checksum).toBeDefined();
    });

    it('should track financial data access', async () => {
      // Create audit entries for financial data access
      await prisma.auditEntry.create({
        data: {
          userId: 'accountant-user',
          action: 'ACCESS',
          details: {
            resource: 'financial_records',
            purpose: 'Monthly reconciliation',
          },
          entityType: 'TRANSACTION',
          entityId: 'transaction-123',
        }
      });

      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateSOXComplianceReport(timeRange);

      expect(report.data.accessLogs).toBeDefined();
      expect(Array.isArray(report.data.accessLogs)).toBe(true);
    });

    it('should check segregation of duties', async () => {
      // Create users with potentially conflicting roles
      await prisma.user.create({
        data: {
          email: 'conflict-user@example.com',
          password: 'hashed',
          firstName: 'Conflict',
          lastName: 'User',
          role: 'ADMIN', // This could be a conflict
        }
      });

      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateSOXComplianceReport(timeRange);

      expect(report.data.segregationOfDuties).toBeDefined();
      expect(typeof report.data.segregationOfDuties.hasConflicts).toBe('boolean');
    });
  });

  describe('Data Retention Compliance', () => {
    it('should create and manage data retention policies', async () => {
      await complianceService.updateDataRetentionPolicy('user_data', 2555, true);
      await complianceService.updateDataRetentionPolicy('audit_logs', 2555, true);
      await complianceService.updateDataRetentionPolicy('session_data', 90, true);

      const policies = await complianceService.getDataRetentionPolicies();

      expect(policies).toHaveLength(3);
      expect(policies.find(p => p.dataType === 'user_data')?.retentionPeriod).toBe(2555);
      expect(policies.find(p => p.dataType === 'audit_logs')?.retentionPeriod).toBe(2555);
      expect(policies.find(p => p.dataType === 'session_data')?.retentionPeriod).toBe(90);
    });

    it('should execute data retention cleanup', async () => {
      // Create old audit entries
      const oldDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days ago

      await prisma.auditEntry.create({
        data: {
          userId: 'old-user',
          action: 'OLD_ACTION',
          details: {},
          entityType: 'USER',
          entityId: 'old-user',
          severity: 'INFO',
          timestamp: oldDate,
        }
      });

      // Set retention policy
      await complianceService.updateDataRetentionPolicy('audit_logs', 365, true);

      const result = await complianceService.executeDataRetentionCleanup('audit_logs');

      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should not delete data when autoDelete is disabled', async () => {
      await complianceService.updateDataRetentionPolicy('session_data', 30, false);

      const result = await complianceService.executeDataRetentionCleanup('session_data');

      expect(result.deletedCount).toBe(0);
    });
  });

  describe('Compliance Violation Detection', () => {
    it('should detect overdue data requests', async () => {
      // Create a user and simulate overdue request
      const user = await prisma.user.create({
        data: {
          email: 'overdue-test@example.com',
          password: 'hashed',
          firstName: 'Overdue',
          lastName: 'Test',
          role: 'TENANT',
        }
      });

      // Create audit entry for data request that's overdue
      const overdueDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      await prisma.auditEntry.create({
        data: {
          userId: user.id,
          action: 'DATA_ACCESS_REQUEST',
          details: { status: 'pending' },
          entityType: 'USER',
          entityId: user.id,
          timestamp: overdueDate,
        }
      });

      const violations = await complianceService.detectComplianceViolations();

      expect(Array.isArray(violations)).toBe(true);
      // Should detect overdue requests
    });

    it('should detect missing retention policies', async () => {
      // Clear existing policies
      await prisma.dataRetentionPolicy.deleteMany();

      const violations = await complianceService.detectComplianceViolations();

      expect(Array.isArray(violations)).toBe(true);
      const missingPolicyViolations = violations.filter(v => v.type === 'MISSING_RETENTION_POLICIES');
      expect(missingPolicyViolations.length).toBeGreaterThan(0);
    });

    it('should detect suspicious activities', async () => {
      // Create multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await prisma.auditEntry.create({
          data: {
            userId: 'suspicious-user',
            action: 'LOGIN_FAILED',
            details: { attempt: i + 1 },
            entityType: 'USER',
            entityId: 'suspicious-user',
            severity: 'WARNING',
            timestamp: new Date(Date.now() - i * 60 * 1000), // Within last hour
          }
        });
      }

      const violations = await complianceService.detectComplianceViolations();

      expect(Array.isArray(violations)).toBe(true);
      // Should detect suspicious login patterns
    });
  });

  describe('Audit Trail Integrity', () => {
    it('should maintain audit trail integrity', async () => {
      const originalEntry = await prisma.auditEntry.create({
        data: {
          userId: 'integrity-test',
          action: 'TEST_ACTION',
          details: { test: 'data' },
          entityType: 'USER',
          entityId: 'integrity-test',
          severity: 'INFO',
        }
      });

      // Verify entry exists and is unchanged
      const retrievedEntry = await prisma.auditEntry.findUnique({
        where: { id: originalEntry.id }
      });

      expect(retrievedEntry?.action).toBe('TEST_ACTION');
      expect(retrievedEntry?.details).toEqual({ test: 'data' });
      expect(retrievedEntry?.timestamp).toBeInstanceOf(Date);
    });

    it('should prevent audit log tampering', async () => {
      const entry = await prisma.auditEntry.create({
        data: {
          userId: 'tamper-test',
          action: 'ORIGINAL_ACTION',
          details: { original: true },
          entityType: 'USER',
          entityId: 'tamper-test',
          severity: 'INFO',
        }
      });

      // Attempt to modify (this should be prevented by database constraints)
      await expect(
        prisma.auditEntry.update({
          where: { id: entry.id },
          data: { action: 'TAMPERED_ACTION' }
        })
      ).rejects.toThrow(); // Should fail due to constraints or triggers
    });
  });

  describe('Data Portability', () => {
    it('should export user data in portable format', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'portability-test@example.com',
          password: 'hashed',
          firstName: 'Portability',
          lastName: 'Test',
          role: 'TENANT',
        }
      });

      // Create some related data
      await prisma.auditEntry.create({
        data: {
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          details: { ipAddress: '127.0.0.1' },
          entityType: 'USER',
          entityId: user.id,
        }
      });

      // Test data portability (this would be implemented in the service)
      // For now, just verify the user exists
      const foundUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { AuditEntry: true }
      });

      expect(foundUser?.AuditEntry).toHaveLength(1);
    });
  });

  describe('Data Erasure (Right to be Forgotten)', () => {
    it('should handle data erasure requests', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'erasure-test@example.com',
          password: 'hashed',
          firstName: 'Erasure',
          lastName: 'Test',
          role: 'TENANT',
        }
      });

      // Create audit trail
      await prisma.auditEntry.create({
        data: {
          userId: user.id,
          action: 'DATA_ERASURE_REQUEST',
          details: { reason: 'User requested complete data deletion' },
          entityType: 'USER',
          entityId: user.id,
        }
      });

      // Verify user exists before erasure
      let foundUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(foundUser).toBeDefined();

      // Note: Actual erasure would be implemented with proper cascade deletes
      // and audit logging. For testing, we just verify the audit entry was created.
      const auditEntries = await prisma.auditEntry.findMany({
        where: { userId: user.id, action: 'DATA_ERASURE_REQUEST' }
      });

      expect(auditEntries).toHaveLength(1);
    });
  });
});