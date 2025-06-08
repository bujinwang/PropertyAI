import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { hash } from 'bcrypt';
import config from '../config';
import { sendEmail } from './emailService';

const prisma = new PrismaClient();
const redis = new Redis(config.redis.url);

// Constants
const TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds
const SALT_ROUNDS = 10;

/**
 * Service for handling password reset functionality
 */
export class PasswordResetService {
  /**
   * Generate a password reset token and send reset email
   * @param email User email
   * @returns Success status and message
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if email exists or not for security
    if (!user) {
      // We'll still return success for security (don't reveal if email exists)
      return {
        success: true,
        message: 'If your email exists in our system, you will receive a password reset link shortly.',
      };
    }

    // Generate a secure random token
    const token = uuidv4();
    const tokenKey = `auth:pwreset:${token}`;

    // Store token in Redis with user ID and expiration
    await redis.set(tokenKey, user.id);
    await redis.expire(tokenKey, TOKEN_EXPIRY);

    // Generate reset URL
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    // Send email with reset link
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password. This link is valid for 1 hour.\n\n${resetUrl}`,
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password.</p>
        <p>This link is valid for 1 hour.</p>
        <p><a href="${resetUrl}">Reset Your Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return {
      success: true,
      message: 'If your email exists in our system, you will receive a password reset link shortly.',
    };
  }

  /**
   * Validate a password reset token
   * @param token Reset token
   * @returns Validation result
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    const tokenKey = `auth:pwreset:${token}`;

    // Check if token exists in Redis
    const userId = await redis.get(tokenKey);

    if (!userId) {
      return { valid: false };
    }

    return {
      valid: true,
      userId,
    };
  }

  /**
   * Reset password using a valid token
   * @param token Reset token
   * @param newPassword New password
   * @returns Reset result
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Validate token
    const validation = await this.validateResetToken(token);

    if (!validation.valid || !validation.userId) {
      return {
        success: false,
        message: 'Invalid or expired reset token.',
      };
    }

    try {
      // Hash the new password
      const hashedPassword = await hash(newPassword, SALT_ROUNDS);

      // Update user's password
      await prisma.user.update({
        where: { id: validation.userId },
        data: {
          password: hashedPassword,
          passwordResetAt: new Date(),
        },
      });

      // Delete the used token
      const tokenKey = `auth:pwreset:${token}`;
      await redis.del(tokenKey);

      // Get user for email notification
      const user = await prisma.user.findUnique({
        where: { id: validation.userId },
        select: { email: true },
      });

      // Send password change confirmation email
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: 'Your Password Has Been Changed',
          text: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
          html: `
            <h1>Password Changed</h1>
            <p>Your password has been changed successfully.</p>
            <p>If you did not make this change, please contact support immediately.</p>
          `,
        });
      }

      return {
        success: true,
        message: 'Password has been reset successfully.',
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Failed to reset password. Please try again.',
      };
    }
  }
}

export default new PasswordResetService(); 