import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, generateRecoveryToken, generateRefreshToken, verifyRefreshToken } from '../services/tokenService';
import { sendRecoveryEmail, sendPasswordResetConfirmationEmail } from '../services/emailService';
import { AppError } from '../middleware/errorMiddleware';
import { lockoutConfig } from '../config/lockout.config';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
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
  } catch (error) {
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
      return next(new AppError('Invalid credentials', 401));
    }

    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
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
