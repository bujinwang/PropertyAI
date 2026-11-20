import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, generateRecoveryToken, generateRefreshToken, verifyRefreshToken } from '../services/tokenService';
import { sendRecoveryEmail, sendPasswordResetConfirmationEmail } from '../services/emailService';
import { AppError } from '../middleware/errorMiddleware';
import { lockoutConfig } from '../config/lockout.config';
import { PUBLIC_SIGNUP_ROLES, normalizePublicSignupRole } from '../middleware/validation';

const prisma = new PrismaClient();

/**
 * Persist an authentication audit entry.
 *
 * OWASP A09:2021 (Security Logging and Monitoring Failures): `/api/auth/login`
 * is the only login path actually mounted (routes/authRoutes.ts:14), so the
 * failed-login auditing has to happen here or not at all.
 *
 * Why this writes `prisma.auditEntry.create` directly instead of calling
 * `enhancedAuthService.logFailedLogin()` — do not "refactor" this into that
 * service:
 *  - `enhancedAuthService` implements a *different*, unrouted login flow; its
 *    `logFailedLogin` is effectively dead code for this endpoint. Calling it
 *    would introduce a service dependency for no behavioural gain.
 *  - The security suites assert against the Prisma table, not against a mocked
 *    helper, so the write must reach the DB.
 * This mirrors the existing direct write style in `resetPassword` /
 * `forgotPassword` / `register` above.
 *
 * Auditing is a side channel: a failure to write must NEVER change the login
 * response. Callers expect 401/403 and must still get it, so failures here are
 * swallowed and warned about rather than propagated to `next()`.
 */
async function writeAuthAudit(
  req: Request,
  data: {
    action: string;
    entityId: string;
    entityType?: string;
    userId?: string | null;
    details: any;
    severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  }
): Promise<void> {
  try {
    await prisma.auditEntry.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        details: data.details,
        entityType: data.entityType ?? 'USER',
        entityId: data.entityId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: data.severity ?? 'WARNING',
      },
    });
  } catch (auditError) {
    console.warn(
      `[auth] Failed to write ${data.action} audit entry for entity ${data.entityId}:`,
      auditError
    );
  }
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // SECURITY (defence in depth): the route already runs
    // `validateRegistration`, but we re-check here so a future caller that
    // reaches `register` directly still cannot escalate to `ADMIN`. We reuse the
    // single shared `normalizePublicSignupRole` helper from `middleware/validation`
    // (rather than a duplicated allowlist) so the two layers cannot drift apart.
    // An explicit-but-invalid role fails closed; a missing role falls through to
    // the Prisma column default (`TENANT`).
    const hasExplicitRole = role !== undefined && role !== null;
    const normalizedRole = normalizePublicSignupRole(role);
    if (hasExplicitRole && !normalizedRole) {
      return next(
        new AppError(
          `Invalid role. Self-service registration permits only: ${PUBLIC_SIGNUP_ROLES.join(', ')}`,
          400
        )
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        // Always persist the canonical enum value. Previously the raw request
        // value was written verbatim, so a lowercase role either never reached
        // this point (case-sensitive allowlist) or, once normalisation was
        // introduced, must not be written in its un-normalised form.
        role: normalizedRole,
      },
    });

    res.status(201).json({
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
  } catch (error: any) {
    // A duplicate signup violates the unique index on User.email. Prisma raises
    // P2002, which nothing else maps to a client error, so it surfaced as an
    // unhandled 500 — a registration conflict is a 400/409, not a server fault.
    if (error?.code === 'P2002') {
      return next(new AppError('An account with this email already exists', 400));
    }
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    const hashedToken = require('crypto').createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      },
    });

    await sendPasswordResetConfirmationEmail(user.email);

    await prisma.auditEntry.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        details: `Password reset for user ${user.email}`,
        entityType: 'USER',
        entityId: user.id,
      },
    });

    res.json({ message: 'Password has been reset' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = generateRecoveryToken();
      const hashedToken = await bcrypt.hash(token, 10);
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expires,
        },
      });

      await sendRecoveryEmail(user.email, token);

      await prisma.auditEntry.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          details: `Password reset requested for user ${user.email}`,
          entityType: 'USER',
          entityId: user.id,
        },
      });
    }

    // Always return a success message to prevent user enumeration
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // `AuditEntry.entityId` is a required String and there is no userId to
      // point at. We use the submitted email instead of a bare 'unknown'
      // placeholder: the email is the only stable identifier an investigator
      // has for an attempted account, and it still lets repeated attempts
      // against the same unregistered address be correlated. The email lives
      // in `entityId` (not `entityType`, which stays 'USER') because the email
      // IS the entity being targeted here; no `userId` row exists to link to.
      await writeAuthAudit(req, {
        action: 'LOGIN_FAILED',
        entityId: email,
        userId: null,
        details: {
          reason: 'USER_NOT_FOUND',
          email,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
      return next(new AppError('Invalid credentials', 401));
    }

    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      await writeAuthAudit(req, {
        action: 'LOGIN_FAILED',
        entityId: user.id,
        userId: user.id,
        details: {
          reason: 'ACCOUNT_LOCKED',
          email,
          lockedUntil: user.lockedUntil,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
      return next(new AppError('Account locked. Please try again later.', 403));
    }

    if (await bcrypt.compare(password, user.password)) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, isLocked: false, lockedUntil: null, lastLogin: new Date() },
      });
      
      const accessToken = generateToken(updatedUser);
      const refreshToken = generateRefreshToken(updatedUser);
      
      // Store refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });
      
      res.json({
        data: {
          token: accessToken,
          refreshToken: refreshToken,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            isActive: updatedUser.isActive,
            phone: updatedUser.phone,
            mfaEnabled: updatedUser.mfaEnabled,
            lastLogin: updatedUser.lastLogin,
            name: `${updatedUser.firstName} ${updatedUser.lastName}`
          }
        }
      });
    } else {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      let isLocked = user.isLocked;
      let lockedUntil = user.lockedUntil;

      if (newFailedAttempts >= lockoutConfig.maxFailedAttempts) {
        isLocked = true;
        lockedUntil = new Date(Date.now() + lockoutConfig.lockoutDurationMinutes * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          isLocked,
          lockedUntil,
        },
      });

      // Distinguish "wrong password" from "wrong password that tripped the
      // lockout" so responders can separate noise from an active brute-force
      // run. The lock event additionally emits ACCOUNT_LOCKED, mirroring
      // enhancedAuthService.ts:421-426.
      await writeAuthAudit(req, {
        action: 'LOGIN_FAILED',
        entityId: user.id,
        userId: user.id,
        details: {
          reason: isLocked
            ? `INVALID_PASSWORD_LOCKOUT_TRIGGERED (attempt ${newFailedAttempts}/${lockoutConfig.maxFailedAttempts})`
            : `INVALID_PASSWORD (attempt ${newFailedAttempts}/${lockoutConfig.maxFailedAttempts})`,
          email,
          failedAttempts: newFailedAttempts,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      if (isLocked) {
        await writeAuthAudit(req, {
          action: 'ACCOUNT_LOCKED',
          entityId: user.id,
          userId: user.id,
          details: {
            failedAttempts: newFailedAttempts,
            lockedUntil,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });
      }

      return next(new AppError('Invalid credentials', 401));
    }
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { settings } = req.body;
    const userId = (req as any).user.id; // Assuming user ID is available from authentication middleware

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        settings: settings, // Store settings as JSON
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phone: true,
        mfaEnabled: true,
        lastLogin: true,
        settings: true, // Select the settings field to return it
      },
    });

    res.json({ settings: updatedUser.settings });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(new AppError('Refresh token required', 401));
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return next(new AppError('Invalid refresh token', 401));
    }
    
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.id,
        refreshToken: refreshToken // Verify token matches stored token
      }
    });
    
    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }
    
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Update stored refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });
    
    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        mfaEnabled: user.mfaEnabled,
        lastLogin: user.lastLogin,
        name: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    next(error);
  }
};
