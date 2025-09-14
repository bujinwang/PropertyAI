import { PrismaClient } from '@prisma/client';
import { enhancedAuthService } from '../enhancedAuthService';
import { AppError } from '../../middleware/errorMiddleware';

const prisma = new PrismaClient();

describe('EnhancedAuthService', () => {
  beforeEach(async () => {
    // Clear test data
    await prisma.auditEntry.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('authenticate', () => {
    it('should authenticate valid user', async () => {
      // Create test user
      const hashedPassword = await require('bcryptjs').hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'TENANT',
        }
      });

      const attempt = {
        email: 'test@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        deviceInfo: { platform: 'test' }
      };

      const result = await enhancedAuthService.authenticate(attempt);

      expect(result.user.id).toBe(user.id);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });

    it('should handle invalid credentials', async () => {
      const attempt = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      };

      await expect(enhancedAuthService.authenticate(attempt)).rejects.toThrow(AppError);
    });

    it('should handle locked account', async () => {
      const hashedPassword = await require('bcryptjs').hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'locked@example.com',
          password: hashedPassword,
          firstName: 'Locked',
          lastName: 'User',
          role: 'TENANT',
          isLocked: true,
          lockedUntil: new Date(Date.now() + 3600000), // Locked for 1 hour
        }
      });

      const attempt = {
        email: 'locked@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      };

      await expect(enhancedAuthService.authenticate(attempt)).rejects.toThrow('Account locked');
    });
  });

  describe('verifyMFA', () => {
    it('should verify valid MFA code', async () => {
      // Create user with MFA secret
      const user = await prisma.user.create({
        data: {
          email: 'mfa@example.com',
          password: 'hashedpassword',
          firstName: 'MFA',
          lastName: 'User',
          role: 'TENANT',
          mfaEnabled: true,
          mfaSecret: 'JBSWY3DPEHPK3PXP', // Test secret
        }
      });

      // Mock the verifyTOTP function to return true for valid code
      const mockVerifyTOTP = jest.spyOn(require('../mfaService'), 'verifyTOTP');
      mockVerifyTOTP.mockReturnValue(true);

      const result = await enhancedAuthService.verifyMFA(user.id, '123456');

      expect(result.user.id).toBe(user.id);
      expect(result.accessToken).toBeDefined();

      mockVerifyTOTP.mockRestore();
    });

    it('should reject invalid MFA code', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'mfa2@example.com',
          password: 'hashedpassword',
          firstName: 'MFA2',
          lastName: 'User',
          role: 'TENANT',
          mfaEnabled: true,
          mfaSecret: 'JBSWY3DPEHPK3PXP',
        }
      });

      const mockVerifyTOTP = jest.spyOn(require('../mfaService'), 'verifyTOTP');
      mockVerifyTOTP.mockReturnValue(false);

      await expect(enhancedAuthService.verifyMFA(user.id, 'invalid')).rejects.toThrow('Invalid MFA code');

      mockVerifyTOTP.mockRestore();
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'strong@example.com',
          password: 'hashedpassword',
          firstName: 'Strong',
          lastName: 'Password',
          role: 'TENANT',
        }
      });

      await expect(enhancedAuthService.validatePasswordStrength('MyStr0ngP@ssw0rd!', user.id)).resolves.not.toThrow();
    });

    it('should reject weak password', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'weak@example.com',
          password: 'hashedpassword',
          firstName: 'Weak',
          lastName: 'Password',
          role: 'TENANT',
        }
      });

      await expect(enhancedAuthService.validatePasswordStrength('weak', user.id)).rejects.toThrow();
    });
  });

  describe('session management', () => {
    it('should create and validate session', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'session@example.com',
          password: 'hashedpassword',
          firstName: 'Session',
          lastName: 'User',
          role: 'TENANT',
        }
      });

      const sessionInfo = {
        sessionToken: 'test-token-123',
        userId: user.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        deviceInfo: { platform: 'test' },
        expiresAt: new Date(Date.now() + 3600000),
      };

      const sessionId = await enhancedAuthService.createSession(sessionInfo);
      expect(sessionId).toBeDefined();

      const validatedUser = await enhancedAuthService.validateSession('test-token-123');
      expect(validatedUser?.id).toBe(user.id);
    });

    it('should invalidate session', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'invalidate@example.com',
          password: 'hashedpassword',
          firstName: 'Invalidate',
          lastName: 'Session',
          role: 'TENANT',
        }
      });

      const sessionInfo = {
        sessionToken: 'invalidate-token',
        userId: user.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        deviceInfo: { platform: 'test' },
        expiresAt: new Date(Date.now() + 3600000),
      };

      await enhancedAuthService.createSession(sessionInfo);

      await enhancedAuthService.invalidateSession('invalidate-token');

      const validatedUser = await enhancedAuthService.validateSession('invalidate-token');
      expect(validatedUser).toBeNull();
    });
  });

  describe('biometric authentication', () => {
    it('should register biometric credential', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'biometric@example.com',
          password: 'hashedpassword',
          firstName: 'Biometric',
          lastName: 'User',
          role: 'TENANT',
        }
      });

      const registration = {
        userId: user.id,
        credentialId: 'biometric-cred-123',
        publicKey: 'biometric-public-key',
        deviceType: 'fingerprint',
        deviceModel: 'iPhone 12',
      };

      await expect(enhancedAuthService.registerBiometric(registration)).resolves.not.toThrow();

      // Check that biometric is enabled for user
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.biometricEnabled).toBe(true);
    });

    it('should authenticate with biometric', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'biometric-auth@example.com',
          password: 'hashedpassword',
          firstName: 'Biometric',
          lastName: 'Auth',
          role: 'TENANT',
          biometricEnabled: true,
        }
      });

      await prisma.biometricAuth.create({
        data: {
          userId: user.id,
          credentialId: 'biometric-cred-auth',
          publicKey: 'biometric-public-key',
          deviceType: 'fingerprint',
          isActive: true,
        }
      });

      const result = await enhancedAuthService.authenticateBiometric('biometric-cred-auth', {
        platform: 'iOS',
        version: '14.0',
      });

      expect(result.user.id).toBe(user.id);
      expect(result.accessToken).toBeDefined();
    });
  });
});