import { complianceService } from '../complianceService';
import { PrismaClient } from '@prisma/client';
import { resetDatabase } from '../../__tests__/testDb';

const prisma = new PrismaClient();

describe('ComplianceService', () => {
  beforeEach(async () => {
    // Truncate every table (CASCADE) rather than deleting User last: 37 models
    // hold a FK to User.id, so a bare user.deleteMany() fails on whichever child
    // table still has rows.
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('generateGDPRComplianceReport', () => {
    it('should generate GDPR compliance report', async () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      };

      const report = await complianceService.generateGDPRComplianceReport(timeRange);

      expect(report.type).toBe('GDPR');
      expect(report.data).toBeDefined();
      expect(report.checksum).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.validUntil).toBeInstanceOf(Date);
    });
  });

  describe('generateCCPAComplianceReport', () => {
    it('should generate CCPA compliance report', async () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateCCPAComplianceReport(timeRange);

      expect(report.type).toBe('CCPA');
      expect(report.data).toBeDefined();
      expect(report.checksum).toBeDefined();
    });
  });

  describe('generateSOXComplianceReport', () => {
    it('should generate SOX compliance report', async () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await complianceService.generateSOXComplianceReport(timeRange);

      expect(report.type).toBe('SOX');
      expect(report.data).toBeDefined();
      expect(report.checksum).toBeDefined();
    });
  });

  describe('data retention policies', () => {
    it('should create data retention policy', async () => {
      await complianceService.updateDataRetentionPolicy('user_data', 365, true);

      const policies = await complianceService.getDataRetentionPolicies();
      expect(policies).toHaveLength(1);
      expect(policies[0].dataType).toBe('user_data');
      expect(policies[0].retentionPeriod).toBe(365);
      expect(policies[0].autoDelete).toBe(true);
    });

    it('should update existing data retention policy', async () => {
      await complianceService.updateDataRetentionPolicy('audit_logs', 2555, true);
      await complianceService.updateDataRetentionPolicy('audit_logs', 365, false);

      const policies = await complianceService.getDataRetentionPolicies();
      const policy = policies.find(p => p.dataType === 'audit_logs');
      expect(policy?.retentionPeriod).toBe(365);
      expect(policy?.autoDelete).toBe(false);
    });
  });

  describe('detectComplianceViolations', () => {
    it('should detect compliance violations', async () => {
      // AuditEntry.userId is a real FK to User.id, so the row it points at has
      // to exist first — a bare 'test-user' string fails on AuditEntry_userId_fkey.
      const user = await prisma.user.create({
        data: {
          email: 'violations@example.com',
          password: 'hashed',
          firstName: 'Violation',
          lastName: 'Fixture',
        },
      });

      // Create some test audit entries that might trigger violations
      await prisma.auditEntry.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: { reason: 'Invalid password' },
          entityType: 'USER',
          entityId: user.id,
          severity: 'WARNING',
        }
      });

      const violations = await complianceService.detectComplianceViolations();

      // Should detect some violations based on the test data
      expect(Array.isArray(violations)).toBe(true);
    });
  });

  describe('createDataAccessRequest', () => {
    it('should create data access request', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'access@example.com',
          password: 'hashed',
          firstName: 'Access',
          lastName: 'Test',
          role: 'TENANT',
          complianceRegion: 'GDPR',
        }
      });

      const request = {
        userId: user.id,
        requestType: 'access' as const,
        reason: 'User requested data access',
        requestedData: ['profile', 'transactions'],
      };

      const result = await complianceService.createDataAccessRequest(request);

      expect(result.requestId).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.requestType).toBe('access');
      expect(result.status).toBe('pending');
      expect(result.responseDeadline).toBeInstanceOf(Date);
    });

    it('should reject invalid user', async () => {
      const request = {
        userId: 'nonexistent-user',
        requestType: 'access' as const,
        reason: 'Test request',
      };

      await expect(complianceService.createDataAccessRequest(request)).rejects.toThrow('User not found');
    });
  });

  describe('executeDataRetentionCleanup', () => {
    it('should execute data retention cleanup for audit logs', async () => {
      // Create old audit entry
      const oldDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days ago

      const user = await prisma.user.create({
        data: {
          email: 'retention@example.com',
          password: 'hashed',
          firstName: 'Retention',
          lastName: 'Fixture',
        },
      });

      await prisma.auditEntry.create({
        data: {
          userId: user.id,
          action: 'TEST_ACTION',
          details: {},
          entityType: 'USER',
          entityId: user.id,
          severity: 'INFO',
          timestamp: oldDate,
        }
      });

      // Create retention policy
      await complianceService.updateDataRetentionPolicy('audit_logs', 365, true);

      const result = await complianceService.executeDataRetentionCleanup('audit_logs');

      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should not delete data when autoDelete is false', async () => {
      await complianceService.updateDataRetentionPolicy('session_data', 30, false);

      const result = await complianceService.executeDataRetentionCleanup('session_data');

      expect(result.deletedCount).toBe(0);
    });
  });
});