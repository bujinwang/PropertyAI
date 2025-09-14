import { secureCredentials } from '../secureCredentials';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
};

const mockDB = {
  transaction: jest.fn(),
  objectStore: jest.fn(),
  close: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(),
};

const mockStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  openCursor: jest.fn(),
  index: jest.fn(),
};

// Mock crypto.subtle
const mockCryptoSubtle = {
  generateKey: jest.fn(),
  exportKey: jest.fn(),
  importKey: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  digest: jest.fn(),
};

// Mock crypto.getRandomValues
const mockGetRandomValues = jest.fn();

// Setup mocks
beforeAll(() => {
  global.indexedDB = mockIndexedDB as any;
  global.crypto = {
    ...global.crypto,
    subtle: mockCryptoSubtle as any,
    getRandomValues: mockGetRandomValues,
  };
});

beforeEach(() => {
  jest.clearAllMocks();

  // Setup default mock implementations
  mockIndexedDB.open.mockReturnValue({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: mockDB,
  });

  mockDB.transaction.mockReturnValue(mockTransaction);
  mockTransaction.objectStore.mockReturnValue(mockStore);

  mockCryptoSubtle.generateKey.mockResolvedValue('mock-key');
  mockCryptoSubtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
  mockCryptoSubtle.importKey.mockResolvedValue('mock-imported-key');
  mockCryptoSubtle.encrypt.mockResolvedValue(new ArrayBuffer(64));
  mockCryptoSubtle.decrypt.mockResolvedValue(new ArrayBuffer(32));

  mockGetRandomValues.mockReturnValue(new Uint8Array(32));
});

describe('SecureCredentials', () => {
  describe('initialize', () => {
    it('should initialize with existing key', async () => {
      mockStore.get.mockImplementation((key) => ({
        onsuccess: (event: any) => {
          event.target.result = {
            id: 'propertyai-encryption-key-v1',
            keyData: new Array(32).fill(0),
            createdAt: new Date().toISOString(),
          };
        },
        onerror: null,
      }));

      await secureCredentials.initialize();

      expect(mockIndexedDB.open).toHaveBeenCalledWith('PropertyAICredentials', 1);
      expect(mockCryptoSubtle.importKey).toHaveBeenCalled();
    });

    it('should generate new key when none exists', async () => {
      mockStore.get.mockImplementation(() => ({
        onsuccess: (event: any) => {
          event.target.result = undefined;
        },
        onerror: null,
      }));

      await secureCredentials.initialize();

      expect(mockCryptoSubtle.generateKey).toHaveBeenCalled();
      expect(mockStore.put).toHaveBeenCalled();
    });
  });

  describe('encrypt/decrypt', () => {
    beforeEach(async () => {
      await secureCredentials.initialize();
    });

    it('should encrypt and decrypt data correctly', async () => {
      const testData = 'sensitive payment information';
      const encrypted = await secureCredentials.encrypt(testData);
      const decrypted = await secureCredentials.decrypt(encrypted);

      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('algorithm', 'AES-GCM');
      expect(decrypted).toBe(testData);
    });

    it('should handle encryption errors', async () => {
      mockCryptoSubtle.encrypt.mockRejectedValue(new Error('Encryption failed'));

      await expect(secureCredentials.encrypt('test')).rejects.toThrow('Encryption failed');
    });

    it('should handle decryption errors', async () => {
      const invalidEncrypted = {
        encrypted: 'invalid',
        iv: 'invalid',
        salt: 'invalid',
        algorithm: 'AES-GCM',
      };

      mockCryptoSubtle.decrypt.mockRejectedValue(new Error('Decryption failed'));

      await expect(secureCredentials.decrypt(invalidEncrypted)).rejects.toThrow('Decryption failed');
    });
  });

  describe('storeCredential', () => {
    beforeEach(async () => {
      await secureCredentials.initialize();
    });

    it('should store credential successfully', async () => {
      mockStore.put.mockImplementation(() => ({
        onsuccess: () => {},
        onerror: null,
      }));

      const testData = { apiKey: 'sk_test_123', secret: 'secret_value' };
      const id = await secureCredentials.storeCredential('payment', 'stripe', testData);

      expect(id).toMatch(/^payment_stripe_\d+$/);
      expect(mockStore.put).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      mockStore.put.mockImplementation(() => ({
        onsuccess: null,
        onerror: (event: any) => {
          event.target.error = new Error('Storage failed');
        },
      }));

      const testData = { apiKey: 'sk_test_123' };

      await expect(
        secureCredentials.storeCredential('payment', 'stripe', testData)
      ).rejects.toThrow();
    });
  });

  describe('getCredential', () => {
    beforeEach(async () => {
      await secureCredentials.initialize();
    });

    it('should retrieve and decrypt credential', async () => {
      const testData = { apiKey: 'sk_test_123', secret: 'secret_value' };
      const encryptedData = await secureCredentials.encrypt(JSON.stringify(testData));

      mockStore.get.mockImplementation(() => ({
        onsuccess: (event: any) => {
          event.target.result = {
            id: 'test_credential',
            type: 'payment',
            name: 'stripe',
            encryptedData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
        onerror: null,
      }));

      const result = await secureCredentials.getCredential('test_credential');

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent credential', async () => {
      mockStore.get.mockImplementation(() => ({
        onsuccess: (event: any) => {
          event.target.result = undefined;
        },
        onerror: null,
      }));

      const result = await secureCredentials.getCredential('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for expired credential', async () => {
      const testData = { apiKey: 'sk_test_123' };
      const encryptedData = await secureCredentials.encrypt(JSON.stringify(testData));

      mockStore.get.mockImplementation(() => ({
        onsuccess: (event: any) => {
          event.target.result = {
            id: 'expired_credential',
            type: 'payment',
            name: 'stripe',
            encryptedData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
          };
        },
        onerror: null,
      }));

      const result = await secureCredentials.getCredential('expired_credential');

      expect(result).toBeNull();
    });
  });

  describe('updateCredential', () => {
    beforeEach(async () => {
      await secureCredentials.initialize();
    });

    it('should update existing credential', async () => {
      const originalData = { apiKey: 'sk_test_123' };
      const updatedData = { apiKey: 'sk_test_456', secret: 'new_secret' };

      // Mock existing credential
      mockStore.get.mockImplementation(() => ({
        onsuccess: (event: any) => {
          event.target.result = {
            id: 'test_credential',
            type: 'payment',
            name: 'stripe',
            encryptedData: 'mock-encrypted-data',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
        onerror: null,
      }));

      await secureCredentials.updateCredential('test_credential', updatedData);

      expect(mockStore.put).toHaveBeenCalled();
    });

    it('should throw error for non-existent credential', async () => {
      mockStore.get.mockImplementation(() => ({
        onsuccess: (event: any) => {
          event.target.result = undefined;
        },
        onerror: null,
      }));

      await expect(
        secureCredentials.updateCredential('nonexistent', { apiKey: 'test' })
      ).rejects.toThrow('Credential not found');
    });
  });

  describe('deleteCredential', () => {
    beforeEach(async () => {
      await secureCredentials.initialize();
    });

    it('should delete credential successfully', async () => {
      mockStore.delete.mockImplementation(() => ({
        onsuccess: () => {},
        onerror: null,
      }));

      await secureCredentials.deleteCredential('test_credential');

      expect(mockStore.delete).toHaveBeenCalledWith('test_credential');
    });
  });

  describe('listCredentials', () => {
    beforeEach(async () => {
      await secureCredentials.initialize();
    });

    it('should list all credentials', async () => {
      const mockCredentials = [
        {
          id: 'cred1',
          type: 'payment',
          name: 'stripe',
          encryptedData: 'mock-data',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cred2',
          type: 'connector',
          name: 'transunion',
          encryptedData: 'mock-data',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockStore.openCursor.mockImplementation(() => ({
        onsuccess: (event: any) => {
          const cursor = mockCredentials.shift();
          event.target.result = cursor ? {
            value: cursor,
            continue: jest.fn(),
          } : null;
        },
        onerror: null,
      }));

      const result = await secureCredentials.listCredentials();

      expect(result).toHaveLength(2);
    });

    it('should list credentials by type', async () => {
      const mockCredentials = [
        {
          id: 'cred1',
          type: 'payment',
          name: 'stripe',
          encryptedData: 'mock-data',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockStore.index.mockReturnValue({
        openCursor: jest.fn(() => ({
          onsuccess: (event: any) => {
            const cursor = mockCredentials.shift();
            event.target.result = cursor ? {
              value: cursor,
              continue: jest.fn(),
            } : null;
          },
          onerror: null,
        })),
      });

      const result = await secureCredentials.listCredentials('payment');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('payment');
    });
  });

  describe('validateApiKey', () => {
    it('should validate Stripe API keys', () => {
      expect(secureCredentials.validateApiKey('sk_test_1234567890')).toBe(true);
      expect(secureCredentials.validateApiKey('pk_live_1234567890')).toBe(true);
      expect(secureCredentials.validateApiKey('invalid_key')).toBe(false);
    });

    it('should validate generic API keys', () => {
      expect(secureCredentials.validateApiKey('some_long_api_key_123')).toBe(true);
      expect(secureCredentials.validateApiKey('short')).toBe(false);
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask sensitive data correctly', () => {
      expect(secureCredentials.maskSensitiveData('1234567890123456')).toBe('************3456');
      expect(secureCredentials.maskSensitiveData('short')).toBe('*****');
    });
  });

  describe('generateSecureApiKey', () => {
    it('should generate secure API key of correct length', () => {
      const key = secureCredentials.generateSecureApiKey(32);
      expect(key).toHaveLength(32);
      expect(key).toMatch(/^[A-Za-z0-9]+$/);
    });
  });
});