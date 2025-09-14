import {
  connectorRegistry,
  createConnectorConfig,
  calculateNextSync,
  shouldRetry,
  ConnectorType,
  SyncFrequency,
} from '../connectorFramework';
import { createBackgroundCheckConnector } from '../connectors/BackgroundCheckConnector';

// Mock fetch globally
global.fetch = jest.fn();

describe('Connector Framework', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear registry between tests
    connectorRegistry['connectors'].clear();
  });

  describe('createConnectorConfig', () => {
    it('should create a valid connector config', () => {
      const config = createConnectorConfig('background_check', 'transunion', {
        region: 'us-east-1',
      }, {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
      });

      expect(config.id).toMatch(/^background_check_transunion_\d+$/);
      expect(config.name).toBe('Transunion background check');
      expect(config.type).toBe('background_check');
      expect(config.provider).toBe('transunion');
      expect(config.config.region).toBe('us-east-1');
      expect(config.credentials.apiKey).toBe('test_key');
      expect(config.credentials.apiSecret).toBe('test_secret');
      expect(config.syncFrequency).toBe('hourly');
      expect(config.retryCount).toBe(0);
      expect(config.maxRetries).toBe(3);
      expect(config.isActive).toBe(false);
    });
  });

  describe('calculateNextSync', () => {
    const baseDate = new Date('2024-01-01T12:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(baseDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle realtime frequency', () => {
      const nextSync = calculateNextSync('realtime');
      expect(nextSync).toBe(baseDate.toISOString());
    });

    it('should calculate 5 minute intervals', () => {
      const nextSync = calculateNextSync('5min');
      const expected = new Date(baseDate);
      expected.setMinutes(expected.getMinutes() + 5);
      expect(nextSync).toBe(expected.toISOString());
    });

    it('should calculate hourly intervals', () => {
      const nextSync = calculateNextSync('hourly');
      const expected = new Date(baseDate);
      expected.setHours(expected.getHours() + 1);
      expect(nextSync).toBe(expected.toISOString());
    });

    it('should calculate daily intervals', () => {
      const nextSync = calculateNextSync('daily');
      const expected = new Date(baseDate);
      expected.setDate(expected.getDate() + 1);
      expect(nextSync).toBe(expected.toISOString());
    });

    it('should calculate weekly intervals', () => {
      const nextSync = calculateNextSync('weekly');
      const expected = new Date(baseDate);
      expected.setDate(expected.getDate() + 7);
      expect(nextSync).toBe(expected.toISOString());
    });
  });

  describe('shouldRetry', () => {
    it('should not retry when max retries reached', () => {
      const error = new Error('Connection failed');
      expect(shouldRetry(error, 3, 3)).toBe(false);
    });

    it('should retry when under max retries', () => {
      const error = new Error('Connection failed');
      expect(shouldRetry(error, 2, 3)).toBe(true);
    });

    it('should not retry authentication errors', () => {
      const error = new Error('Authentication failed');
      expect(shouldRetry(error, 0, 3)).toBe(false);
    });

    it('should not retry invalid credentials', () => {
      const error = new Error('Invalid credentials');
      expect(shouldRetry(error, 0, 3)).toBe(false);
    });

    it('should not retry insufficient permissions', () => {
      const error = new Error('Insufficient permissions');
      expect(shouldRetry(error, 0, 3)).toBe(false);
    });

    it('should not retry not found errors', () => {
      const error = new Error('Not found');
      expect(shouldRetry(error, 0, 3)).toBe(false);
    });
  });

  describe('ConnectorRegistry', () => {
    let mockConnector: any;

    beforeEach(() => {
      mockConnector = {
        type: 'background_check' as ConnectorType,
        provider: 'transunion',
        getConfig: jest.fn().mockReturnValue({
          id: 'test_connector',
          type: 'background_check',
          provider: 'transunion',
          status: 'connected',
        }),
        getStatus: jest.fn().mockReturnValue('connected'),
      };
    });

    it('should register connectors', () => {
      connectorRegistry.register(mockConnector);
      expect(connectorRegistry.getAll()).toContain(mockConnector);
    });

    it('should retrieve connectors by type and provider', () => {
      connectorRegistry.register(mockConnector);
      const retrieved = connectorRegistry.get('background_check', 'transunion');
      expect(retrieved).toBe(mockConnector);
    });

    it('should return null for non-existent connectors', () => {
      const retrieved = connectorRegistry.get('background_check', 'nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should get connectors by type', () => {
      const mockConnector2 = {
        ...mockConnector,
        provider: 'experian',
      };

      connectorRegistry.register(mockConnector);
      connectorRegistry.register(mockConnector2);

      const backgroundCheckConnectors = connectorRegistry.getByType('background_check');
      expect(backgroundCheckConnectors).toHaveLength(2);
    });

    it('should get connectors by status', () => {
      const mockDisconnectedConnector = {
        ...mockConnector,
        getStatus: jest.fn().mockReturnValue('disconnected'),
      };

      connectorRegistry.register(mockConnector);
      connectorRegistry.register(mockDisconnectedConnector);

      const connectedConnectors = connectorRegistry.getByStatus('connected');
      const disconnectedConnectors = connectorRegistry.getByStatus('disconnected');

      expect(connectedConnectors).toHaveLength(1);
      expect(disconnectedConnectors).toHaveLength(1);
    });
  });

  describe('BackgroundCheckConnector', () => {
    let connector: any;
    let config: any;

    beforeEach(() => {
      config = createConnectorConfig('background_check', 'transunion', {}, {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
      });
      connector = createBackgroundCheckConnector('transunion', config);
    });

    it('should initialize correctly', async () => {
      await connector.initialize(config);
      expect(connector.getConfig()).toEqual(config);
    });

    it('should validate config with API key', async () => {
      const isValid = await connector.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should reject config without API key', async () => {
      const invalidConfig = createConnectorConfig('background_check', 'transunion', {}, {});
      const invalidConnector = createBackgroundCheckConnector('transunion', invalidConfig);

      await expect(invalidConnector.validateConfig()).rejects.toThrow('API key is required');
    });

    it('should test connection successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      });

      const result = await connector.testConnection();
      expect(result).toBeUndefined(); // Should not throw
    });

    it('should handle connection test failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Service unavailable',
      });

      await expect(connector.testConnection()).rejects.toThrow('Connection test failed');
    });

    it('should perform sync', async () => {
      // Mock the sync process
      connector.getPendingRequests = jest.fn().mockResolvedValue([]);
      connector.performSync = jest.fn().mockResolvedValue({
        success: true,
        recordsProcessed: 0,
        errors: [],
      });

      const result = await connector.sync();

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle sync errors', async () => {
      connector.getPendingRequests = jest.fn().mockRejectedValue(new Error('Database error'));
      connector.performSync = jest.fn().mockRejectedValue(new Error('Sync failed'));

      const result = await connector.sync();

      expect(result.success).toBe(false);
      expect(result.recordsProcessed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Sync failed');
    });

    it('should submit background check request', async () => {
      const mockResponse = { requestId: 'bg_req_123' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const requestData = {
        tenantId: 'tenant_123',
        tenantName: 'John Doe',
        tenantEmail: 'john@example.com',
        propertyId: 'prop_456',
        unitId: 'unit_789',
        requestType: 'standard' as const,
      };

      const result = await connector.submitBackgroundCheck(requestData);

      expect(global.fetch).toHaveBeenCalledWith('/background-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      expect(result).toBe('bg_req_123');
    });

    it('should get background check results', async () => {
      const mockResults = {
        requestId: 'bg_req_123',
        status: 'completed',
        results: {
          overallScore: 85,
          riskLevel: 'low',
          criminalRecords: [],
          creditScore: 750,
          employmentVerification: [],
          referenceChecks: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResults),
      });

      const result = await connector.getBackgroundCheckResults('bg_req_123');

      expect(result).toEqual(mockResults);
    });

    it('should get supported packages', async () => {
      const packages = await connector.getSupportedPackages();
      expect(packages).toEqual(['standard', 'premium', 'express']);
    });
  });
});