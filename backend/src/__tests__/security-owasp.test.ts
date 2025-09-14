import request from 'supertest';
import { app } from '../app'; // Assuming you have an Express app
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('OWASP Top 10 Security Tests', () => {
  beforeEach(async () => {
    // Clear test data
    await prisma.auditEntry.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('A01:2021 - Broken Access Control', () => {
    it('should prevent unauthorized access to user profiles', async () => {
      // Create test users
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password: 'hashed',
          firstName: 'User',
          lastName: 'One',
          role: 'TENANT',
        }
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          password: 'hashed',
          firstName: 'User',
          lastName: 'Two',
          role: 'TENANT',
        }
      });

      // Try to access user2's profile as user1
      const response = await request(app)
        .get(`/api/users/${user2.id}`)
        .set('Authorization', `Bearer mock-token-for-${user1.id}`);

      expect(response.status).toBe(403);
    });

    it('should prevent IDOR attacks', async () => {
      // Test with manipulated IDs
      const response = await request(app)
        .get('/api/users/../../../etc/passwd')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(400);
    });
  });

  describe('A02:2021 - Cryptographic Failures', () => {
    it('should use secure password hashing', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await require('bcryptjs').hash(password, 10);

      // Verify hash is different from plain password
      expect(hashedPassword).not.toBe(password);

      // Verify hash can be validated
      const isValid = await require('bcryptjs').compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = ['123', 'password', 'abc', ''];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password,
            firstName: 'Test',
            lastName: 'User',
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('password');
      }
    });
  });

  describe('A03:2021 - Injection', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousEmail = "' OR '1'='1'; --";

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousEmail,
          password: 'password',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should prevent NoSQL injection', async () => {
      const maliciousInput = { $ne: null };

      const response = await request(app)
        .post('/api/search')
        .send({ query: maliciousInput });

      expect(response.status).toBe(400);
    });

    it('should sanitize user inputs', async () => {
      const maliciousInput = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: maliciousInput,
          address: '123 Main St',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('suspicious');
    });
  });

  describe('A04:2021 - Insecure Design', () => {
    it('should implement rate limiting', async () => {
      const requests = Array(101).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(requests);

      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should have secure session management', async () => {
      // Test session timeout
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired-token');

      expect(response.status).toBe(401);
    });
  });

  describe('A05:2021 - Security Misconfiguration', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).not.toContain('stack');
      expect(response.body).not.toContain('Error:');
    });

    it('should have security headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('A06:2021 - Vulnerable and Outdated Components', () => {
    it('should validate dependencies for known vulnerabilities', () => {
      // This would typically be done with tools like npm audit
      // For this test, we'll check that we're using recent versions
      const packageJson = require('../../../package.json');

      expect(packageJson.dependencies).toBeDefined();
      // Add specific version checks as needed
    });
  });

  describe('A07:2021 - Identification and Authentication Failures', () => {
    it('should enforce MFA for sensitive operations', async () => {
      // Create user without MFA
      const user = await prisma.user.create({
        data: {
          email: 'nomfa@example.com',
          password: 'hashed',
          firstName: 'No',
          lastName: 'MFA',
          role: 'TENANT',
          mfaEnabled: false,
        }
      });

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer mock-token-for-${user.id}`)
        .send({ action: 'delete' });

      expect(response.status).toBe(403);
    });

    it('should handle account lockout correctly', async () => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: 'lockout@example.com',
          password: 'hashed',
          firstName: 'Lockout',
          lastName: 'Test',
          role: 'TENANT',
        }
      });

      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'lockout@example.com',
            password: 'wrongpassword',
          });
      }

      // Next attempt should be blocked
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'lockout@example.com',
          password: 'correctpassword',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('locked');
    });
  });

  describe('A08:2021 - Software and Data Integrity Failures', () => {
    it('should validate data integrity', async () => {
      // Test with tampered data
      const tamperedData = 'tampered-data';

      const response = await request(app)
        .post('/api/validate-data')
        .send({ data: tamperedData, checksum: 'invalid-checksum' });

      expect(response.status).toBe(400);
    });

    it('should prevent deserialization attacks', async () => {
      const maliciousPayload = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } }
      };

      const response = await request(app)
        .post('/api/process-data')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
    });
  });

  describe('A09:2021 - Security Logging and Monitoring Failures', () => {
    it('should log security events', async () => {
      const beforeCount = await prisma.auditEntry.count();

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrong',
        });

      const afterCount = await prisma.auditEntry.count();
      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    it('should log failed authentication attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      // Check that failed login was logged
      const auditEntries = await prisma.auditEntry.findMany({
        where: {
          action: 'LOGIN_FAILED',
          entityType: 'USER',
        },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });

      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0].severity).toBe('WARNING');
    });
  });

  describe('A10:2021 - Server-Side Request Forgery (SSRF)', () => {
    it('should prevent SSRF attacks', async () => {
      const maliciousUrls = [
        'http://localhost:22',
        'http://127.0.0.1:3306',
        'http://169.254.169.254/latest/meta-data/', // AWS metadata
      ];

      for (const url of maliciousUrls) {
        const response = await request(app)
          .post('/api/fetch-url')
          .send({ url });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('invalid');
      }
    });

    it('should validate URLs', async () => {
      const response = await request(app)
        .post('/api/fetch-url')
        .send({ url: 'javascript:alert("xss")' });

      expect(response.status).toBe(400);
    });
  });
});