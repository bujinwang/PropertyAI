// Secure Credential Management Utility
// Handles encryption/decryption of sensitive data and secure storage

interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  algorithm: string;
}

interface CredentialStorage {
  id: string;
  type: 'payment' | 'connector' | 'api_key';
  name: string;
  encryptedData: EncryptedData;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

class SecureCredentialsManager {
  private encryptionKey: CryptoKey | null = null;
  private keyId = 'propertyai-encryption-key-v1';

  // Initialize the encryption system
  async initialize(): Promise<void> {
    if (this.encryptionKey) return;

    try {
      // Try to get existing key from IndexedDB
      this.encryptionKey = await this.getStoredKey();

      if (!this.encryptionKey) {
        // Generate new key if none exists
        this.encryptionKey = await this.generateKey();
        await this.storeKey(this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  // Generate a new AES-GCM encryption key
  private async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  // Store encryption key securely in IndexedDB
  private async storeKey(key: CryptoKey): Promise<void> {
    const keyData = await crypto.subtle.exportKey('raw', key);
    const db = await this.openDatabase();

    const transaction = db.transaction(['encryption_keys'], 'readwrite');
    const store = transaction.objectStore('encryption_keys');

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        id: this.keyId,
        keyData: Array.from(new Uint8Array(keyData)),
        createdAt: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  }

  // Retrieve stored encryption key from IndexedDB
  private async getStoredKey(): Promise<CryptoKey | null> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['encryption_keys'], 'readonly');
      const store = transaction.objectStore('encryption_keys');

      const keyRecord = await new Promise<any>((resolve, reject) => {
        const request = store.get(this.keyId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();

      if (keyRecord) {
        return await crypto.subtle.importKey(
          'raw',
          new Uint8Array(keyRecord.keyData),
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      }
    } catch (error) {
      console.warn('No stored encryption key found:', error);
    }

    return null;
  }

  // Open IndexedDB database
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PropertyAICredentials', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create encryption keys store
        if (!db.objectStoreNames.contains('encryption_keys')) {
          db.createObjectStore('encryption_keys', { keyPath: 'id' });
        }

        // Create credentials store
        if (!db.objectStoreNames.contains('credentials')) {
          const store = db.createObjectStore('credentials', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  // Encrypt sensitive data
  async encrypt(data: string): Promise<EncryptedData> {
    if (!this.encryptionKey) {
      await this.initialize();
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random IV and salt
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      dataBuffer
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer),
      salt: this.arrayBufferToBase64(salt.buffer),
      algorithm: 'AES-GCM',
    };
  }

  // Decrypt sensitive data
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    if (!this.encryptionKey) {
      await this.initialize();
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    const encrypted = this.base64ToArrayBuffer(encryptedData.encrypted);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.encryptionKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Store encrypted credentials
  async storeCredential(
    type: 'payment' | 'connector' | 'api_key',
    name: string,
    data: Record<string, any>,
    expiresAt?: string
  ): Promise<string> {
    const id = `${type}_${name}_${Date.now()}`;
    const jsonData = JSON.stringify(data);
    const encryptedData = await this.encrypt(jsonData);

    const credential: CredentialStorage = {
      id,
      type,
      name,
      encryptedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt,
    };

    const db = await this.openDatabase();
    const transaction = db.transaction(['credentials'], 'readwrite');
    const store = transaction.objectStore('credentials');

    await new Promise<void>((resolve, reject) => {
      const request = store.put(credential);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    return id;
  }

  // Retrieve and decrypt credentials
  async getCredential(id: string): Promise<Record<string, any> | null> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['credentials'], 'readonly');
      const store = transaction.objectStore('credentials');

      const credential = await new Promise<CredentialStorage>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();

      if (credential) {
        // Check if credential has expired
        if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
          await this.deleteCredential(id);
          return null;
        }

        const decryptedData = await this.decrypt(credential.encryptedData);
        return JSON.parse(decryptedData);
      }
    } catch (error) {
      console.error('Error retrieving credential:', error);
    }

    return null;
  }

  // Update existing credential
  async updateCredential(id: string, data: Record<string, any>): Promise<void> {
    const existingCredential = await this.getCredential(id);
    if (!existingCredential) {
      throw new Error('Credential not found');
    }

    const updatedData = { ...existingCredential, ...data };
    const jsonData = JSON.stringify(updatedData);
    const encryptedData = await this.encrypt(jsonData);

    const db = await this.openDatabase();
    const transaction = db.transaction(['credentials'], 'readwrite');
    const store = transaction.objectStore('credentials');

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        ...existingCredential,
        encryptedData,
        updatedAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  }

  // Delete credential
  async deleteCredential(id: string): Promise<void> {
    const db = await this.openDatabase();
    const transaction = db.transaction(['credentials'], 'readwrite');
    const store = transaction.objectStore('credentials');

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  }

  // List credentials by type
  async listCredentials(type?: 'payment' | 'connector' | 'api_key'): Promise<CredentialStorage[]> {
    const db = await this.openDatabase();
    const transaction = db.transaction(['credentials'], 'readonly');
    const store = transaction.objectStore('credentials');

    const credentials: CredentialStorage[] = [];

    await new Promise<void>((resolve, reject) => {
      const request = type
        ? store.index('type').openCursor(IDBKeyRange.only(type))
        : store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          credentials.push(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });

    db.close();
    return credentials;
  }

  // Utility methods for base64 conversion
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Validate API key format
  validateApiKey(apiKey: string, provider?: string): boolean {
    if (!apiKey || apiKey.length < 10) return false;

    // Provider-specific validation
    switch (provider) {
      case 'stripe':
        return apiKey.startsWith('sk_') || apiKey.startsWith('pk_');
      case 'paypal':
        return apiKey.length >= 20;
      case 'transunion':
        return /^\w{32}$/.test(apiKey);
      default:
        return true; // Generic validation
    }
  }

  // Mask sensitive data for display
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) return '*'.repeat(data.length);
    return '*'.repeat(data.length - visibleChars) + data.slice(-visibleChars);
  }

  // Generate secure API key
  generateSecureApiKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Rotate encryption key (for security maintenance)
  async rotateEncryptionKey(): Promise<void> {
    const newKey = await this.generateKey();
    const oldKey = this.encryptionKey;

    if (!oldKey) {
      throw new Error('No existing key to rotate');
    }

    // Re-encrypt all existing credentials with new key
    const credentials = await this.listCredentials();
    for (const credential of credentials) {
      try {
        const decryptedData = await this.decrypt(credential.encryptedData);
        const reEncryptedData = await this.encrypt(decryptedData);

        const db = await this.openDatabase();
        const transaction = db.transaction(['credentials'], 'readwrite');
        const store = transaction.objectStore('credentials');

        await new Promise<void>((resolve, reject) => {
          const request = store.put({
            ...credential,
            encryptedData: reEncryptedData,
            updatedAt: new Date().toISOString(),
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });

        db.close();
      } catch (error) {
        console.error(`Failed to re-encrypt credential ${credential.id}:`, error);
      }
    }

    // Store new key
    this.encryptionKey = newKey;
    await this.storeKey(newKey);

    console.log('Encryption key rotated successfully');
  }
}

// Export singleton instance
export const secureCredentials = new SecureCredentialsManager();

// Initialize on module load
secureCredentials.initialize().catch(console.error);