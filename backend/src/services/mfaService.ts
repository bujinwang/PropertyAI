import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * MFA Service provides methods to generate, verify, and manage Multi-Factor Authentication
 * This implementation uses time-based one-time passwords (TOTP)
 */
export class MFAService {
  /**
   * Generate a random secret key for MFA setup
   */
  generateSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Generate a TOTP code from a user's secret
   * @param secret - The user's secret key
   * @param window - Time window in 30-second increments (default: 0 = current window)
   */
  generateTOTP(secret: string, window: number = 0): string {
    // Calculate current time window (30-second increments since Unix epoch)
    let timeWindowValue = Math.floor(Date.now() / 30000) + window;
    
    // Create a buffer from the time window (big-endian, 8 bytes)
    const timeBuffer = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      timeBuffer[7 - i] = timeWindowValue & 0xff;
      timeWindowValue = timeWindowValue >> 8;
    }
    
    // Generate HMAC using the secret
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    const hmacResult = hmac.update(timeBuffer).digest();
    
    // Dynamic truncation
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary = ((hmacResult[offset] & 0x7f) << 24) |
                   ((hmacResult[offset + 1] & 0xff) << 16) |
                   ((hmacResult[offset + 2] & 0xff) << 8) |
                   (hmacResult[offset + 3] & 0xff);
    
    // Generate 6-digit code
    const code = binary % 1000000;
    return code.toString().padStart(6, '0');
  }

  /**
   * Verify a TOTP code provided by the user
   * @param secret - The user's secret key
   * @param userCode - The code provided by the user
   * @param window - Number of time windows to check before/after current (default: 1)
   */
  verifyTOTP(secret: string, userCode: string, window: number = 1): boolean {
    // Check current window and neighboring windows based on the provided window size
    for (let i = -window; i <= window; i++) {
      const generatedCode = this.generateTOTP(secret, i);
      if (generatedCode === userCode) {
        return true;
      }
    }
    return false;
  }

  /**
   * Enable MFA for a user
   * @param userId - The user's ID
   * @param secret - The generated secret key
   */
  async enableMFA(userId: string, secret: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: secret
      }
    });
  }

  /**
   * Disable MFA for a user
   * @param userId - The user's ID
   */
  async disableMFA(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null
      }
    });
  }

  /**
   * Check if MFA is enabled for a user
   * @param userId - The user's ID
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true }
    });
    return user?.mfaEnabled || false;
  }

  /**
   * Get the MFA secret for a user
   * @param userId - The user's ID
   */
  async getMFASecret(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true }
    });
    return user?.mfaSecret || null;
  }
}

export default new MFAService(); 