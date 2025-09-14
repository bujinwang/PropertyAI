import { PrismaClient } from '@prisma/client';
import { enhancedAuthService } from './enhancedAuthService';
import { AppError } from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export interface BiometricChallenge {
  challenge: string;
  userId: string;
  expiresAt: Date;
}

export interface BiometricAssertion {
  credentialId: string;
  authenticatorData: string;
  clientDataJSON: string;
  signature: string;
  userHandle?: string;
}

export interface BiometricRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  authenticatorSelection: {
    authenticatorAttachment?: string;
    requireResidentKey: boolean;
    userVerification: string;
  };
  timeout: number;
  attestation: string;
}

export class BiometricAuthService {
  private readonly CHALLENGE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  async generateRegistrationOptions(userId: string): Promise<BiometricRegistrationOptions> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const challenge = this.generateChallenge();

    // Store challenge temporarily
    await this.storeChallenge(challenge, userId);

    return {
      challenge,
      rp: {
        name: 'PropertyAI',
        id: process.env.RP_ID || 'localhost',
      },
      user: {
        id: user.id,
        name: user.email,
        displayName: `${user.firstName} ${user.lastName}`,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        requireResidentKey: false,
        userVerification: 'preferred',
      },
      timeout: 60000,
      attestation: 'direct',
    };
  }

  async registerBiometricCredential(
    userId: string,
    credentialId: string,
    publicKey: string,
    deviceType: string,
    deviceModel?: string
  ): Promise<void> {
    // Check if user already has this credential
    const existing = await prisma.biometricAuth.findUnique({
      where: { credentialId }
    });

    if (existing) {
      throw new AppError('Biometric credential already exists', 409);
    }

    // Verify the credential belongs to the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.biometricAuth.create({
      data: {
        userId,
        credentialId,
        publicKey,
        deviceType,
        deviceModel,
      }
    });

    // Update user biometric status
    await prisma.user.update({
      where: { id: userId },
      data: { biometricEnabled: true }
    });

    // Audit log
    await enhancedAuthService.auditLog(userId, 'BIOMETRIC_REGISTERED', {
      deviceType,
      deviceModel,
      credentialId: credentialId.substring(0, 8) + '...' // Partial for security
    });
  }

  async generateAuthenticationOptions(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { BiometricAuth: true }
    });

    if (!user || !user.biometricEnabled || user.BiometricAuth.length === 0) {
      throw new AppError('Biometric authentication not available', 400);
    }

    const challenge = this.generateChallenge();
    await this.storeChallenge(challenge, userId);

    return {
      challenge,
      allowCredentials: user.BiometricAuth.map(cred => ({
        type: 'public-key',
        id: Buffer.from(cred.credentialId, 'base64'),
        transports: ['usb', 'nfc', 'ble', 'internal'],
      })),
      timeout: 60000,
      userVerification: 'preferred',
      rpId: process.env.RP_ID || 'localhost',
    };
  }

  async verifyBiometricAssertion(
    userId: string,
    assertion: BiometricAssertion
  ): Promise<boolean> {
    const credential = await prisma.biometricAuth.findUnique({
      where: { credentialId: assertion.credentialId }
    });

    if (!credential || credential.userId !== userId || !credential.isActive) {
      return false;
    }

    // In a real implementation, you would verify the cryptographic signature
    // For now, we'll do basic validation
    const isValid = await this.verifyWebAuthnAssertion(assertion, credential.publicKey);

    if (isValid) {
      // Update last used
      await prisma.biometricAuth.update({
        where: { id: credential.id },
        data: { lastUsed: new Date() }
      });

      // Audit log
      await enhancedAuthService.auditLog(userId, 'BIOMETRIC_LOGIN_SUCCESS', {
        deviceType: credential.deviceType,
        deviceModel: credential.deviceModel,
      });
    }

    return isValid;
  }

  async removeBiometricCredential(userId: string, credentialId: string): Promise<void> {
    const credential = await prisma.biometricAuth.findUnique({
      where: { credentialId }
    });

    if (!credential || credential.userId !== userId) {
      throw new AppError('Biometric credential not found', 404);
    }

    await prisma.biometricAuth.update({
      where: { id: credential.id },
      data: { isActive: false }
    });

    // Check if user has any active biometric credentials left
    const activeCredentials = await prisma.biometricAuth.count({
      where: { userId, isActive: true }
    });

    if (activeCredentials === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { biometricEnabled: false }
      });
    }

    // Audit log
    await enhancedAuthService.auditLog(userId, 'BIOMETRIC_REMOVED', {
      deviceType: credential.deviceType,
      deviceModel: credential.deviceModel,
    });
  }

  async getUserBiometricCredentials(userId: string): Promise<any[]> {
    const credentials = await prisma.biometricAuth.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        credentialId: true,
        deviceType: true,
        deviceModel: true,
        lastUsed: true,
        createdAt: true,
      }
    });

    return credentials.map(cred => ({
      ...cred,
      credentialId: cred.credentialId.substring(0, 8) + '...' // Mask for security
    }));
  }

  private generateChallenge(): string {
    return require('crypto').randomBytes(32).toString('base64');
  }

  private async storeChallenge(challenge: string, userId: string): Promise<void> {
    // In a real implementation, store this in Redis or similar with expiration
    // For now, we'll store in a simple in-memory map (not suitable for production)
    if (!global.challengeStore) {
      global.challengeStore = new Map();
    }

    const expiresAt = new Date(Date.now() + this.CHALLENGE_TIMEOUT);
    global.challengeStore.set(challenge, { userId, expiresAt });

    // Clean up expired challenges
    setTimeout(() => {
      global.challengeStore.delete(challenge);
    }, this.CHALLENGE_TIMEOUT);
  }

  private async verifyChallenge(challenge: string, userId: string): Promise<boolean> {
    if (!global.challengeStore) return false;

    const stored = global.challengeStore.get(challenge);
    if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
      return false;
    }

    global.challengeStore.delete(challenge);
    return true;
  }

  private async verifyWebAuthnAssertion(assertion: BiometricAssertion, publicKey: string): Promise<boolean> {
    // This is a simplified verification
    // In a real implementation, you would:
    // 1. Parse the clientDataJSON
    // 2. Verify the challenge matches
    // 3. Parse the authenticatorData
    // 4. Verify the signature using the public key
    // 5. Check user presence/verification flags

    try {
      const clientData = JSON.parse(Buffer.from(assertion.clientDataJSON, 'base64').toString());

      // Verify challenge (simplified)
      const challengeValid = await this.verifyChallenge(clientData.challenge, assertion.userHandle || '');

      if (!challengeValid) {
        return false;
      }

      // In production, implement full WebAuthn verification
      // For now, return true if challenge was valid
      return true;
    } catch (error) {
      console.error('WebAuthn verification error:', error);
      return false;
    }
  }
}

export const biometricAuthService = new BiometricAuthService();