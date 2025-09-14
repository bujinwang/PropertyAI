import crypto from 'crypto';
import { prisma } from '../config/database';
import { DeviceType, ProtocolType } from '@prisma/client';

interface DeviceCredentials {
  deviceId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  permissions: string[];
}

interface EncryptedMessage {
  data: string; // Base64 encoded encrypted data
  iv: string;   // Base64 encoded initialization vector
  tag?: string; // Base64 encoded authentication tag (for AES-GCM)
}

interface DeviceCertificate {
  deviceId: string;
  certificate: string;
  privateKey: string;
  publicKey: string;
  issuedAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

class IoTSecurityService {
  private encryptionKey: Buffer;
  private certificateAuthority: any = null;

  constructor() {
    // Generate or load encryption key
    this.encryptionKey = this.loadOrGenerateEncryptionKey();
    this.initializeCertificateAuthority();
  }

  // Device Authentication
  async authenticateDevice(deviceId: string, credentials: any): Promise<DeviceCredentials | null> {
    try {
      // Verify device exists and is registered
      const device = await prisma.ioTDevice.findUnique({
        where: { deviceId }
      });

      if (!device) {
        throw new Error('Device not found');
      }

      // Verify credentials based on protocol
      const isValid = await this.verifyDeviceCredentials(device, credentials);

      if (!isValid) {
        await this.logSecurityEvent('AUTHENTICATION_FAILED', {
          deviceId,
          reason: 'Invalid credentials',
          ipAddress: credentials.ipAddress,
          userAgent: credentials.userAgent
        });
        return null;
      }

      // Generate access tokens
      const accessToken = this.generateAccessToken(deviceId);
      const refreshToken = this.generateRefreshToken(deviceId);

      const deviceCredentials: DeviceCredentials = {
        deviceId,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        permissions: this.getDevicePermissions(device.type)
      };

      // Store credentials securely
      await this.storeDeviceCredentials(deviceCredentials);

      await this.logSecurityEvent('AUTHENTICATION_SUCCESS', {
        deviceId,
        protocol: device.protocol
      });

      return deviceCredentials;

    } catch (error) {
      console.error('Device authentication error:', error);
      return null;
    }
  }

  async verifyAccessToken(deviceId: string, token: string): Promise<boolean> {
    try {
      // Verify token format and signature
      const isValid = this.verifyTokenSignature(token);

      if (!isValid) return false;

      // Check if token is not expired and not revoked
      const credentials = await this.getStoredCredentials(deviceId);

      if (!credentials || credentials.expiresAt < new Date()) {
        return false;
      }

      // Check if token matches
      return credentials.accessToken === token;

    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  async refreshDeviceToken(deviceId: string, refreshToken: string): Promise<DeviceCredentials | null> {
    try {
      const credentials = await this.getStoredCredentials(deviceId);

      if (!credentials || credentials.refreshToken !== refreshToken) {
        return null;
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(deviceId);
      const newRefreshToken = this.generateRefreshToken(deviceId);

      const newCredentials: DeviceCredentials = {
        ...credentials,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 3600000)
      };

      await this.storeDeviceCredentials(newCredentials);

      return newCredentials;

    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  // Encryption/Decryption
  encryptMessage(data: any, deviceId: string): EncryptedMessage {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, this.encryptionKey);

      cipher.setAAD(Buffer.from(deviceId));

      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const tag = cipher.getAuthTag();

      return {
        data: encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64')
      };

    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  decryptMessage(encryptedMessage: EncryptedMessage, deviceId: string): any {
    try {
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);

      decipher.setAAD(Buffer.from(deviceId));

      if (encryptedMessage.tag) {
        decipher.setAuthTag(Buffer.from(encryptedMessage.tag, 'base64'));
      }

      decipher.setIV(Buffer.from(encryptedMessage.iv, 'base64'));

      let decrypted = decipher.update(encryptedMessage.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);

    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Certificate Management
  async generateDeviceCertificate(deviceId: string): Promise<DeviceCertificate> {
    try {
      // Generate key pair
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      // Create certificate (simplified - in production use proper CA)
      const certificate = this.createSelfSignedCertificate(deviceId, publicKey);

      const deviceCert: DeviceCertificate = {
        deviceId,
        certificate,
        privateKey,
        publicKey,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        revoked: false
      };

      // Store certificate
      await this.storeDeviceCertificate(deviceCert);

      return deviceCert;

    } catch (error) {
      console.error('Certificate generation error:', error);
      throw new Error('Failed to generate device certificate');
    }
  }

  async verifyDeviceCertificate(deviceId: string, certificate: string): Promise<boolean> {
    try {
      const storedCert = await this.getStoredCertificate(deviceId);

      if (!storedCert || storedCert.revoked) {
        return false;
      }

      // Verify certificate is not expired
      if (storedCert.expiresAt < new Date()) {
        return false;
      }

      // Verify certificate matches
      return storedCert.certificate === certificate;

    } catch (error) {
      console.error('Certificate verification error:', error);
      return false;
    }
  }

  async revokeDeviceCertificate(deviceId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE "DeviceCertificate"
        SET revoked = true, updated_at = NOW()
        WHERE device_id = ${deviceId}
      `;

      await this.logSecurityEvent('CERTIFICATE_REVOKED', { deviceId });

    } catch (error) {
      console.error('Certificate revocation error:', error);
      throw new Error('Failed to revoke certificate');
    }
  }

  // Access Control
  async checkDevicePermission(deviceId: string, permission: string, resource?: string): Promise<boolean> {
    try {
      const device = await prisma.ioTDevice.findUnique({
        where: { deviceId },
        include: { property: true }
      });

      if (!device) return false;

      const devicePermissions = this.getDevicePermissions(device.type);

      // Check basic permission
      if (!devicePermissions.includes(permission)) {
        return false;
      }

      // Additional resource-based checks
      if (resource) {
        return this.checkResourceAccess(device, permission, resource);
      }

      return true;

    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  async authorizeDeviceAction(deviceId: string, action: string, parameters?: any): Promise<boolean> {
    try {
      // Rate limiting check
      const isAllowed = await this.checkRateLimit(deviceId, action);
      if (!isAllowed) {
        await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { deviceId, action });
        return false;
      }

      // Permission check
      const hasPermission = await this.checkDevicePermission(deviceId, action);
      if (!hasPermission) {
        await this.logSecurityEvent('PERMISSION_DENIED', { deviceId, action });
        return false;
      }

      // Parameter validation
      if (parameters) {
        const isValid = this.validateActionParameters(action, parameters);
        if (!isValid) {
          await this.logSecurityEvent('INVALID_PARAMETERS', { deviceId, action, parameters });
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Authorization error:', error);
      return false;
    }
  }

  // Security Monitoring
  async logSecurityEvent(eventType: string, details: any): Promise<void> {
    try {
      await prisma.auditEntry.create({
        data: {
          action: `IOT_${eventType}`,
          details,
          entityType: 'IoTDevice',
          entityId: details.deviceId || 'unknown',
          complianceType: 'GENERAL'
        }
      });
    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }

  async getSecurityEvents(deviceId?: string, limit: number = 100): Promise<any[]> {
    try {
      const where: any = {
        action: { startsWith: 'IOT_' }
      };

      if (deviceId) {
        where.entityId = deviceId;
      }

      return await prisma.auditEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit
      });

    } catch (error) {
      console.error('Security events retrieval error:', error);
      return [];
    }
  }

  // Private helper methods
  private loadOrGenerateEncryptionKey(): Buffer {
    // In production, load from secure key management service
    // For development, generate a key
    const key = process.env.IOT_ENCRYPTION_KEY;
    if (key) {
      return Buffer.from(key, 'hex');
    }

    // Generate new key (store securely in production)
    const newKey = crypto.randomBytes(32);
    console.warn('Generated new encryption key - store securely in production!');
    return newKey;
  }

  private initializeCertificateAuthority(): void {
    // Initialize certificate authority (simplified)
    // In production, use proper CA infrastructure
    console.log('Certificate Authority initialized');
  }

  private async verifyDeviceCredentials(device: any, credentials: any): Promise<boolean> {
    // Implement protocol-specific credential verification
    switch (device.protocol) {
      case ProtocolType.MQTT:
        return this.verifyMQTTCredentials(device, credentials);
      case ProtocolType.WIFI:
        return this.verifyWiFiCredentials(device, credentials);
      case ProtocolType.BLUETOOTH_LE:
        return this.verifyBluetoothCredentials(device, credentials);
      default:
        return false;
    }
  }

  private verifyMQTTCredentials(device: any, credentials: any): boolean {
    // Verify MQTT username/password or certificate
    return credentials.username && credentials.password;
  }

  private verifyWiFiCredentials(device: any, credentials: any): boolean {
    // Verify WiFi authentication
    return credentials.ssid && credentials.password;
  }

  private verifyBluetoothCredentials(device: any, credentials: any): boolean {
    // Verify Bluetooth pairing
    return credentials.pin || credentials.passkey;
  }

  private generateAccessToken(deviceId: string): string {
    const payload = {
      deviceId,
      type: 'access',
      iat: Date.now(),
      exp: Date.now() + 3600000 // 1 hour
    };

    return this.signToken(payload);
  }

  private generateRefreshToken(deviceId: string): string {
    const payload = {
      deviceId,
      type: 'refresh',
      iat: Date.now(),
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };

    return this.signToken(payload);
  }

  private signToken(payload: any): string {
    // Simplified token signing (use proper JWT in production)
    const data = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('base64');

    return Buffer.from(`${data}.${signature}`).toString('base64');
  }

  private verifyTokenSignature(token: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [data, signature] = decoded.split('.');

      const expectedSignature = crypto.createHmac('sha256', this.encryptionKey)
        .update(data)
        .digest('base64');

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  private getDevicePermissions(deviceType: DeviceType): string[] {
    const basePermissions = ['read:sensor', 'write:actuator'];

    switch (deviceType) {
      case DeviceType.SECURITY_CAMERA:
        return [...basePermissions, 'read:video', 'control:ptz'];
      case DeviceType.SMART_LOCK:
        return [...basePermissions, 'control:lock', 'read:access'];
      case DeviceType.SMART_THERMOSTAT:
        return [...basePermissions, 'control:temperature', 'control:mode'];
      case DeviceType.ENERGY_METER:
        return [...basePermissions, 'read:energy', 'read:power'];
      default:
        return basePermissions;
    }
  }

  private checkResourceAccess(device: any, permission: string, resource: string): boolean {
    // Implement resource-based access control
    // Check if device has access to specific resources
    return true; // Simplified
  }

  private async checkRateLimit(deviceId: string, action: string): Promise<boolean> {
    // Implement rate limiting logic
    // Track requests per device and action
    return true; // Simplified
  }

  private validateActionParameters(action: string, parameters: any): boolean {
    // Validate action parameters based on action type
    return true; // Simplified
  }

  private async storeDeviceCredentials(credentials: DeviceCredentials): Promise<void> {
    // Store credentials securely (use encrypted database fields in production)
    // This is simplified - implement proper secure storage
  }

  private async getStoredCredentials(deviceId: string): Promise<DeviceCredentials | null> {
    // Retrieve stored credentials
    return null; // Simplified
  }

  private createSelfSignedCertificate(deviceId: string, publicKey: string): string {
    // Create self-signed certificate (simplified)
    // In production, use proper certificate generation
    return `-----BEGIN CERTIFICATE-----\n${deviceId}\n-----END CERTIFICATE-----`;
  }

  private async storeDeviceCertificate(certificate: DeviceCertificate): Promise<void> {
    // Store certificate securely
  }

  private async getStoredCertificate(deviceId: string): Promise<DeviceCertificate | null> {
    // Retrieve stored certificate
    return null; // Simplified
  }
}

export const iotSecurityService = new IoTSecurityService();