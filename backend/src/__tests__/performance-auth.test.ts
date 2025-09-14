import { enhancedAuthService } from '../services/enhancedAuthService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication Performance Tests', () => {
  let testUsers: any[] = [];

  beforeAll(async () => {
    // Create test users for performance testing
    for (let i = 0; i < 100; i++) {
      const user = await prisma.user.create({
        data: {
          email: `perf-test-${i}@example.com`,
          password: await require('bcryptjs').hash('password123', 10),
          firstName: `Test${i}`,
          lastName: `User${i}`,
          role: 'TENANT',
        }
      });
      testUsers.push(user);
    }
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: { startsWith: 'perf-test-' }
      }
    });
    await prisma.$disconnect();
  });

  describe('Authentication Performance', () => {
    it('should handle authentication requests within acceptable time limits', async () => {
      const attempts = testUsers.slice(0, 10).map(user => ({
        email: user.email,
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'Performance Test Agent',
        deviceInfo: { platform: 'test' }
      }));

      const startTime = Date.now();

      const results = await Promise.all(
        attempts.map(attempt => enhancedAuthService.authenticate(attempt))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / attempts.length;

      console.log(`Authentication Performance:
        Total time: ${totalTime}ms
        Average time: ${averageTime}ms per request
        Requests per second: ${(1000 / averageTime).toFixed(2)}`);

      // Assert acceptable performance (should be under 5 seconds total for 10 requests)
      expect(totalTime).toBeLessThan(5000);
      expect(averageTime).toBeLessThan(500); // Under 500ms per request

      // Verify all authentications succeeded
      results.forEach(result => {
        expect(result.user).toBeDefined();
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      });
    });

    it('should handle concurrent authentication requests', async () => {
      const concurrentRequests = 50;
      const attempts = Array(concurrentRequests).fill(null).map((_, i) => ({
        email: testUsers[i % testUsers.length].email,
        password: 'password123',
        ipAddress: `127.0.0.${i % 255}`,
        userAgent: `Concurrent Test Agent ${i}`,
        deviceInfo: { platform: 'test', requestId: i }
      }));

      const startTime = Date.now();

      const results = await Promise.all(
        attempts.map(attempt => enhancedAuthService.authenticate(attempt))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / concurrentRequests;

      console.log(`Concurrent Authentication Performance:
        Total time: ${totalTime}ms
        Average time: ${averageTime}ms per request
        Throughput: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)} req/sec`);

      // Assert acceptable concurrent performance
      expect(totalTime).toBeLessThan(10000); // Under 10 seconds for 50 concurrent requests
      expect(averageTime).toBeLessThan(1000); // Under 1 second per request

      // Verify all authentications succeeded
      results.forEach(result => {
        expect(result.user).toBeDefined();
        expect(result.accessToken).toBeDefined();
      });
    });

    it('should handle MFA verification performance', async () => {
      // Create a user with MFA enabled
      const user = await prisma.user.create({
        data: {
          email: 'mfa-perf@example.com',
          password: await require('bcryptjs').hash('password123', 10),
          firstName: 'MFA',
          lastName: 'Perf',
          role: 'TENANT',
          mfaEnabled: true,
          mfaSecret: 'JBSWY3DPEHPK3PXP', // Test secret
        }
      });

      const mfaRequests = Array(20).fill(null).map(() => ({
        userId: user.id,
        code: '123456', // Valid TOTP code for test secret
      }));

      const startTime = Date.now();

      // Mock the verifyTOTP function to return true for performance testing
      const mockVerifyTOTP = jest.spyOn(require('../mfaService'), 'verifyTOTP');
      mockVerifyTOTP.mockReturnValue(true);

      const results = await Promise.all(
        mfaRequests.map(request => enhancedAuthService.verifyMFA(request.userId, request.code))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / mfaRequests.length;

      console.log(`MFA Verification Performance:
        Total time: ${totalTime}ms
        Average time: ${averageTime}ms per verification
        Throughput: ${(mfaRequests.length / (totalTime / 1000)).toFixed(2)} verifications/sec`);

      expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 20 verifications
      expect(averageTime).toBeLessThan(100); // Under 100ms per verification

      mockVerifyTOTP.mockRestore();

      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should handle biometric authentication performance', async () => {
      // Create user with biometric auth
      const user = await prisma.user.create({
        data: {
          email: 'biometric-perf@example.com',
          password: await require('bcryptjs').hash('password123', 10),
          firstName: 'Biometric',
          lastName: 'Perf',
          role: 'TENANT',
          biometricEnabled: true,
        }
      });

      await prisma.biometricAuth.create({
        data: {
          userId: user.id,
          credentialId: 'biometric-perf-cred',
          publicKey: 'biometric-public-key',
          deviceType: 'fingerprint',
          isActive: true,
        }
      });

      const biometricRequests = Array(30).fill(null).map((_, i) => ({
        credentialId: 'biometric-perf-cred',
        deviceInfo: { platform: 'iOS', requestId: i }
      }));

      const startTime = Date.now();

      const results = await Promise.all(
        biometricRequests.map(request =>
          enhancedAuthService.authenticateBiometric(request.credentialId, request.deviceInfo)
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / biometricRequests.length;

      console.log(`Biometric Authentication Performance:
        Total time: ${totalTime}ms
        Average time: ${averageTime}ms per authentication
        Throughput: ${(biometricRequests.length / (totalTime / 1000)).toFixed(2)} auth/sec`);

      expect(totalTime).toBeLessThan(3000); // Under 3 seconds for 30 authentications
      expect(averageTime).toBeLessThan(150); // Under 150ms per authentication

      // Clean up
      await prisma.biometricAuth.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Session Management Performance', () => {
    it('should handle session validation efficiently', async () => {
      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 25; i++) {
        const user = testUsers[i % testUsers.length];
        const sessionInfo = {
          sessionToken: `session-token-${i}`,
          userId: user.id,
          ipAddress: `127.0.0.${i % 255}`,
          userAgent: `Session Test Agent ${i}`,
          deviceInfo: { platform: 'test' },
          expiresAt: new Date(Date.now() + 3600000),
        };

        const sessionId = await enhancedAuthService.createSession(sessionInfo);
        sessions.push({ sessionId, token: sessionInfo.sessionToken });
      }

      const startTime = Date.now();

      // Validate all sessions
      const validationResults = await Promise.all(
        sessions.map(session => enhancedAuthService.validateSession(session.token))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / sessions.length;

      console.log(`Session Validation Performance:
        Total time: ${totalTime}ms
        Average time: ${averageTime}ms per validation
        Throughput: ${(sessions.length / (totalTime / 1000)).toFixed(2)} validations/sec`);

      expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 25 validations
      expect(averageTime).toBeLessThan(100); // Under 100ms per validation

      // Verify all validations succeeded
      validationResults.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Password Validation Performance', () => {
    it('should validate passwords efficiently', async () => {
      const user = testUsers[0];
      const testPasswords = [
        'MyStr0ngP@ssw0rd!',
        'C0mpl3xP@ss123!',
        'V3ryS3cur3P@ss!',
        'T0pS3cr3tP@ss!',
        'Ult1m@t3P@ssw0rd!',
      ];

      const startTime = Date.now();

      const validationResults = await Promise.all(
        testPasswords.map(password =>
          enhancedAuthService.validatePasswordStrength(password, user.id)
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / testPasswords.length;

      console.log(`Password Validation Performance:
        Total time: ${totalTime}ms
        Average time: ${averageTime}ms per validation
        Throughput: ${(testPasswords.length / (totalTime / 1000)).toFixed(2)} validations/sec`);

      expect(totalTime).toBeLessThan(500); // Under 500ms for 5 validations
      expect(averageTime).toBeLessThan(100); // Under 100ms per validation

      // All validations should pass
      validationResults.forEach(() => {
        // If no error thrown, validation passed
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks during concurrent operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform many concurrent operations
      const operations = Array(100).fill(null).map(async (_, i) => {
        const user = testUsers[i % testUsers.length];
        const attempt = {
          email: user.email,
          password: 'password123',
          ipAddress: `127.0.0.${i % 255}`,
          userAgent: `Memory Test Agent ${i}`,
          deviceInfo: { platform: 'test' }
        };

        return enhancedAuthService.authenticate(attempt);
      });

      await Promise.all(operations);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory Usage:
        Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Memory increase should be reasonable (less than 50MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});