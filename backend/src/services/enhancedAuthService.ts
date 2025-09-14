import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { generateToken, generateRefreshToken, verifyRefreshToken } from './tokenService';
import { AppError } from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export interface LoginAttempt {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: any;
}

export interface BiometricRegistration {
  userId: string;
  credentialId: string;
  publicKey: string;
  deviceType: string;
  deviceModel?: string;
}

export interface SessionInfo {
  sessionToken: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: any;
  expiresAt: Date;
}

export class EnhancedAuthService {
  private readonly SESSION_TIMEOUT = 3600000; // 1 hour
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 900000; // 15 minutes

  async authenticate(attempt: LoginAttempt): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    requiresMFA?: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { email: attempt.email },
      include: { SecuritySettings: true }
    });

    if (!user) {
      await this.logFailedLogin(attempt, 'User not found');
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      await this.logFailedLogin(attempt, 'Account locked', user.id);
      throw new AppError('Account locked. Please try again later.', 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(attempt.password, user.password);
    if (!isValidPassword) {
      await this.handleFailedLogin(user, attempt);
      throw new AppError('Invalid credentials', 401);
    }

    // Check if MFA is required
    if (user.mfaEnabled || user.SecuritySettings?.requireMFA) {
      return {
        user,
        accessToken: '',
        refreshToken: '',
        sessionId: '',
        requiresMFA: true
      };
    }

    // Successful login
    return await this.completeLogin(user, attempt);
  }

  async verifyMFA(userId: string, code: string, loginAttempt?: LoginAttempt): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { SecuritySettings: true }
    });

    if (!user || !user.mfaSecret) {
      throw new AppError('MFA not set up', 400);
    }

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) {
      if (loginAttempt) {
        await this.logFailedLogin(loginAttempt, 'Invalid MFA code', userId);
      }
      throw new AppError('Invalid MFA code', 400);
    }

    return await this.completeLogin(user, loginAttempt);
  }

  async registerBiometric(registration: BiometricRegistration): Promise<void> {
    const existing = await prisma.biometricAuth.findUnique({
      where: { credentialId: registration.credentialId }
    });

    if (existing) {
      throw new AppError('Biometric credential already exists', 409);
    }

    await prisma.biometricAuth.create({
      data: {
        userId: registration.userId,
        credentialId: registration.credentialId,
        publicKey: registration.publicKey,
        deviceType: registration.deviceType,
        deviceModel: registration.deviceModel,
      }
    });

    // Update user biometric status
    await prisma.user.update({
      where: { id: registration.userId },
      data: { biometricEnabled: true }
    });

    await this.auditLog(registration.userId, 'BIOMETRIC_REGISTERED', {
      deviceType: registration.deviceType,
      deviceModel: registration.deviceModel
    });
  }

  async authenticateBiometric(credentialId: string, deviceInfo?: any): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const biometric = await prisma.biometricAuth.findUnique({
      where: { credentialId },
      include: { User: { include: { SecuritySettings: true } } }
    });

    if (!biometric || !biometric.isActive) {
      throw new AppError('Biometric authentication failed', 401);
    }

    const user = biometric.User;

    // Update last used
    await prisma.biometricAuth.update({
      where: { id: biometric.id },
      data: { lastUsed: new Date() }
    });

    await this.auditLog(user.id, 'BIOMETRIC_LOGIN', {
      deviceType: biometric.deviceType,
      deviceModel: biometric.deviceModel,
      deviceInfo
    });

    return await this.completeLogin(user, {
      email: user.email,
      password: '', // Not needed for biometric
      deviceInfo
    });
  }

  async createSession(sessionInfo: SessionInfo): Promise<string> {
    const session = await prisma.session.create({
      data: {
        userId: sessionInfo.userId,
        sessionToken: sessionInfo.sessionToken,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
        deviceInfo: sessionInfo.deviceInfo,
        expiresAt: sessionInfo.expiresAt,
      }
    });

    return session.id;
  }

  async validateSession(sessionToken: string): Promise<User | null> {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { User: true }
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    });

    return session.User;
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    await prisma.session.updateMany({
      where: { sessionToken },
      data: { isActive: false }
    });
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId },
      data: { isActive: false }
    });
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Validate new password against security settings
    await this.validatePasswordStrength(newPassword, userId);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password history
    const passwordHistory = user.passwordHistory as string[] || [];
    passwordHistory.unshift(user.password); // Add current password to history
    if (passwordHistory.length > 5) { // Keep only last 5 passwords
      passwordHistory.pop();
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordLastChanged: new Date(),
        passwordHistory,
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      }
    });

    // Invalidate all sessions except current
    await this.invalidateAllUserSessions(userId);

    await this.auditLog(userId, 'PASSWORD_CHANGED', {});
  }

  async validatePasswordStrength(password: string, userId: string): Promise<void> {
    const settings = await prisma.securitySettings.findUnique({
      where: { userId }
    });

    const minLength = settings?.passwordMinLength || 8;
    const requireUpper = settings?.passwordRequireUpper ?? true;
    const requireLower = settings?.passwordRequireLower ?? true;
    const requireNumber = settings?.passwordRequireNumber ?? true;
    const requireSpecial = settings?.passwordRequireSpecial ?? true;

    if (password.length < minLength) {
      throw new AppError(`Password must be at least ${minLength} characters long`, 400);
    }

    if (requireUpper && !/[A-Z]/.test(password)) {
      throw new AppError('Password must contain at least one uppercase letter', 400);
    }

    if (requireLower && !/[a-z]/.test(password)) {
      throw new AppError('Password must contain at least one lowercase letter', 400);
    }

    if (requireNumber && !/\d/.test(password)) {
      throw new AppError('Password must contain at least one number', 400);
    }

    if (requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?/]/.test(password)) {
      throw new AppError('Password must contain at least one special character', 400);
    }
  }

  private async completeLogin(user: User, attempt?: LoginAttempt): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    // Reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
        lastLogin: new Date(),
        lastActivity: new Date(),
      }
    });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Create session
    const sessionTimeout = user.sessionTimeout || this.SESSION_TIMEOUT;
    const expiresAt = new Date(Date.now() + sessionTimeout);

    const sessionId = await this.createSession({
      sessionToken: accessToken,
      userId: user.id,
      ipAddress: attempt?.ipAddress,
      userAgent: attempt?.userAgent,
      deviceInfo: attempt?.deviceInfo,
      expiresAt,
    });

    // Audit log successful login
    await this.auditLog(user.id, 'LOGIN_SUCCESS', {
      ipAddress: attempt?.ipAddress,
      userAgent: attempt?.userAgent,
      deviceInfo: attempt?.deviceInfo,
    });

    return {
      user: { ...user, lastLogin: new Date() },
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  private async handleFailedLogin(user: User, attempt: LoginAttempt): Promise<void> {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const maxAttempts = user.SecuritySettings?.maxLoginAttempts || this.MAX_LOGIN_ATTEMPTS;

    let isLocked = false;
    let lockedUntil: Date | null = null;

    if (newFailedAttempts >= maxAttempts) {
      isLocked = true;
      const lockoutDuration = user.SecuritySettings?.lockoutDuration || this.LOCKOUT_DURATION;
      lockedUntil = new Date(Date.now() + lockoutDuration);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        isLocked,
        lockedUntil,
        lastLockedAt: isLocked ? new Date() : user.lastLockedAt,
      }
    });

    await this.logFailedLogin(attempt, `Failed login attempt ${newFailedAttempts}/${maxAttempts}`, user.id);

    if (isLocked) {
      await this.auditLog(user.id, 'ACCOUNT_LOCKED', {
        failedAttempts: newFailedAttempts,
        lockedUntil
      });
    }
  }

  private async logFailedLogin(attempt: LoginAttempt, reason: string, userId?: string): Promise<void> {
    await prisma.auditEntry.create({
      data: {
        userId,
        action: 'LOGIN_FAILED',
        details: {
          reason,
          email: attempt.email,
          ipAddress: attempt.ipAddress,
          userAgent: attempt.userAgent,
          deviceInfo: attempt.deviceInfo,
        },
        entityType: 'USER',
        entityId: userId || 'unknown',
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        severity: 'WARNING',
      }
    });
  }

  private async auditLog(userId: string, action: string, details: any, severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO'): Promise<void> {
    await prisma.auditEntry.create({
      data: {
        userId,
        action,
        details,
        entityType: 'USER',
        entityId: userId,
        severity,
      }
    });
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id, refreshToken }
    });

    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  async getSecuritySettings(userId: string): Promise<any> {
    const settings = await prisma.securitySettings.findUnique({
      where: { userId }
    });

    return settings || {
      passwordMinLength: 8,
      passwordRequireUpper: true,
      passwordRequireLower: true,
      passwordRequireNumber: true,
      passwordRequireSpecial: true,
      sessionTimeout: 3600000,
      maxLoginAttempts: 5,
      lockoutDuration: 900000,
      requireMFA: false,
      allowBiometric: true,
      allowSSO: true,
    };
  }

  async updateSecuritySettings(userId: string, settings: any): Promise<void> {
    await prisma.securitySettings.upsert({
      where: { userId },
      update: settings,
      create: { userId, ...settings }
    });
  }

  async getActiveSessions(userId: string): Promise<any[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        sessionToken: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastActivity: true,
        expiresAt: true,
      },
      orderBy: { lastActivity: 'desc' }
    });

    return sessions;
  }

  async invalidateSessionById(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
  }
}

export const enhancedAuthService = new EnhancedAuthService();