import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import config from '../config';

const prisma = new PrismaClient();
const redis = new Redis(config.redis.url);

// Constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

interface LockoutInfo {
  isLocked: boolean;
  failedAttempts: number;
  unlockTime?: Date;
  remainingTime?: number; // in seconds
}

/**
 * Service to manage account lockout functionality
 */
export class AccountLockService {
  /**
   * Record a failed login attempt for a user
   * @param userId User ID
   * @returns Current lockout information after recording the failed attempt
   */
  async recordFailedAttempt(userId: string): Promise<LockoutInfo> {
    // Check if account is already locked
    const lockInfo = await this.getLockoutInfo(userId);
    if (lockInfo.isLocked) {
      return lockInfo;
    }

    // Increment failed attempts
    const key = `auth:lockout:${userId}`;
    const failedAttempts = await redis.incr(key);
    
    // Set expiry if it's the first failed attempt
    if (failedAttempts === 1) {
      // Key expires after 24 hours if not locked (to reset failed attempts)
      await redis.expire(key, 24 * 60 * 60);
    }

    // Lock account if max attempts reached
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return this.lockAccount(userId);
    }

    // Return updated lockout info
    return {
      isLocked: false,
      failedAttempts,
    };
  }

  /**
   * Lock a user account
   * @param userId User ID
   * @returns Lockout information
   */
  async lockAccount(userId: string): Promise<LockoutInfo> {
    const key = `auth:lockout:${userId}`;
    const lockKey = `auth:lock:${userId}`;
    
    // Calculate unlock time
    const unlockTime = new Date();
    unlockTime.setMinutes(unlockTime.getMinutes() + LOCKOUT_DURATION_MINUTES);
    
    // Store lock information in Redis
    await redis.set(lockKey, unlockTime.toISOString());
    await redis.expire(lockKey, LOCKOUT_DURATION_MINUTES * 60);
    
    // Update user record in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: unlockTime,
        lastLockedAt: new Date(),
      },
    });
    
    // Get current failed attempts
    const failedAttempts = parseInt(await redis.get(key) || '0', 10);
    
    return {
      isLocked: true,
      failedAttempts,
      unlockTime,
      remainingTime: LOCKOUT_DURATION_MINUTES * 60,
    };
  }

  /**
   * Reset failed login attempts for a user
   * @param userId User ID
   */
  async resetFailedAttempts(userId: string): Promise<void> {
    const key = `auth:lockout:${userId}`;
    await redis.del(key);
  }

  /**
   * Unlock a user account
   * @param userId User ID
   * @returns Unlock success status
   */
  async unlockAccount(userId: string): Promise<boolean> {
    const lockKey = `auth:lock:${userId}`;
    
    // Remove lock from Redis
    await redis.del(lockKey);
    
    // Reset failed attempts
    await this.resetFailedAttempts(userId);
    
    // Update user record in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
      },
    });
    
    return true;
  }

  /**
   * Get current lockout information for a user
   * @param userId User ID
   * @returns Lockout information
   */
  async getLockoutInfo(userId: string): Promise<LockoutInfo> {
    const key = `auth:lockout:${userId}`;
    const lockKey = `auth:lock:${userId}`;
    
    // Get lock information from Redis
    const lockTimeStr = await redis.get(lockKey);
    const failedAttempts = parseInt(await redis.get(key) || '0', 10);
    
    // If not locked, return only failed attempts
    if (!lockTimeStr) {
      return {
        isLocked: false,
        failedAttempts,
      };
    }
    
    // Calculate remaining lock time
    const unlockTime = new Date(lockTimeStr);
    const now = new Date();
    
    // If lock has expired, unlock account
    if (unlockTime <= now) {
      await this.unlockAccount(userId);
      return {
        isLocked: false,
        failedAttempts: 0,
      };
    }
    
    // Calculate remaining time in seconds
    const remainingTime = Math.ceil((unlockTime.getTime() - now.getTime()) / 1000);
    
    return {
      isLocked: true,
      failedAttempts,
      unlockTime,
      remainingTime,
    };
  }

  /**
   * Check if a user account is locked
   * @param userId User ID
   * @returns True if locked, false otherwise
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    const lockInfo = await this.getLockoutInfo(userId);
    return lockInfo.isLocked;
  }
}

export default new AccountLockService(); 