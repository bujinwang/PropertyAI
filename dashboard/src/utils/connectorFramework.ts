// Connector Framework for Third-Party Service Integrations

export type ConnectorType =
  | 'background_check'
  | 'maintenance_vendor'
  | 'document_storage'
  | 'property_listing'
  | 'accounting'
  | 'iot_device'
  | 'email_sms'
  | 'webhook';

export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'pending' | 'syncing';

export type SyncFrequency = 'realtime' | '5min' | '15min' | '30min' | 'hourly' | 'daily' | 'weekly';

export interface ConnectorConfig {
  id: string;
  name: string;
  type: ConnectorType;
  provider: string;
  status: ConnectorStatus;
  config: Record<string, any>;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    username?: string;
    password?: string;
    token?: string;
    refreshToken?: string;
    webhookUrl?: string;
  };
  syncFrequency: SyncFrequency;
  lastSync?: string;
  nextSync?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  source: string;
}

// Base Connector Interface
export interface BaseConnector {
  readonly type: ConnectorType;
  readonly provider: string;

  // Lifecycle methods
  initialize(config: ConnectorConfig): Promise<void>;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  validateConfig(): Promise<boolean>;

  // Sync methods
  sync(): Promise<SyncResult>;
  getLastSync(): Promise<string | null>;

  // Webhook handling
  handleWebhook(payload: WebhookPayload): Promise<void>;

  // Utility methods
  getStatus(): ConnectorStatus;
  getConfig(): ConnectorConfig;
  updateConfig(config: Partial<ConnectorConfig>): Promise<void>;
}

// Abstract Base Connector Implementation
export abstract class AbstractConnector implements BaseConnector {
  protected config: ConnectorConfig;
  protected isInitialized = false;

  constructor(config: ConnectorConfig) {
    this.config = { ...config };
  }

  abstract readonly type: ConnectorType;
  abstract readonly provider: string;

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = { ...config };
    this.isInitialized = true;
    await this.validateConfig();
  }

  async connect(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Connector not initialized');
    }

    try {
      // Implement connection logic in subclasses
      await this.testConnection();
      this.config.status = 'connected';
      this.config.errorMessage = undefined;
      return true;
    } catch (error) {
      this.config.status = 'error';
      this.config.errorMessage = error instanceof Error ? error.message : 'Connection failed';
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.config.status = 'disconnected';
    this.isInitialized = false;
  }

  abstract validateConfig(): Promise<boolean>;
  abstract testConnection(): Promise<void>;

  async sync(): Promise<SyncResult> {
    if (!this.isInitialized || this.config.status !== 'connected') {
      throw new Error('Connector not ready for sync');
    }

    const startTime = Date.now();
    this.config.status = 'syncing';

    try {
      const result = await this.performSync();
      this.config.status = 'connected';
      this.config.lastSync = new Date().toISOString();
      this.config.errorMessage = undefined;
      this.config.retryCount = 0;

      return {
        ...result,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.config.status = 'error';
      this.config.errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.config.retryCount++;

      throw error;
    }
  }

  abstract performSync(): Promise<Omit<SyncResult, 'duration' | 'timestamp'>>;

  async getLastSync(): Promise<string | null> {
    return this.config.lastSync || null;
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // Default implementation - override in subclasses
    console.log(`Received webhook from ${this.provider}:`, payload);
  }

  getStatus(): ConnectorStatus {
    return this.config.status;
  }

  getConfig(): ConnectorConfig {
    return { ...this.config };
  }

  async updateConfig(config: Partial<ConnectorConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.validateConfig();
  }
}

// Connector Registry
export class ConnectorRegistry {
  private connectors = new Map<string, BaseConnector>();

  register(connector: BaseConnector): void {
    const key = `${connector.type}_${connector.provider}`;
    this.connectors.set(key, connector);
  }

  get(type: ConnectorType, provider: string): BaseConnector | undefined {
    const key = `${type}_${provider}`;
    return this.connectors.get(key);
  }

  getAll(): BaseConnector[] {
    return Array.from(this.connectors.values());
  }

  getByType(type: ConnectorType): BaseConnector[] {
    return this.getAll().filter(connector => connector.type === type);
  }

  getByStatus(status: ConnectorStatus): BaseConnector[] {
    return this.getAll().filter(connector => connector.getStatus() === status);
  }

  async initializeAll(): Promise<void> {
    const promises = this.getAll().map(async (connector) => {
      try {
        await connector.initialize(connector.getConfig());
      } catch (error) {
        console.error(`Failed to initialize connector ${connector.provider}:`, error);
      }
    });

    await Promise.all(promises);
  }

  async syncAll(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const connectors = this.getAll().filter(c => c.getStatus() === 'connected');

    for (const connector of connectors) {
      try {
        const result = await connector.sync();
        results.push(result);
      } catch (error) {
        console.error(`Failed to sync connector ${connector.provider}:`, error);
        results.push({
          success: false,
          recordsProcessed: 0,
          errors: [error instanceof Error ? error.message : 'Sync failed'],
          duration: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }
}

// Global connector registry instance
export const connectorRegistry = new ConnectorRegistry();

// Utility functions
export function createConnectorConfig(
  type: ConnectorType,
  provider: string,
  config: Record<string, any> = {},
  credentials: Partial<ConnectorConfig['credentials']> = {}
): ConnectorConfig {
  return {
    id: `${type}_${provider}_${Date.now()}`,
    name: `${provider} ${type.replace('_', ' ')}`,
    type,
    provider,
    status: 'disconnected',
    config,
    credentials,
    syncFrequency: 'hourly',
    retryCount: 0,
    maxRetries: 3,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function calculateNextSync(frequency: SyncFrequency, lastSync?: string): string {
  const now = new Date();
  let nextSync = new Date(now);

  switch (frequency) {
    case 'realtime':
      return now.toISOString();
    case '5min':
      nextSync.setMinutes(now.getMinutes() + 5);
      break;
    case '15min':
      nextSync.setMinutes(now.getMinutes() + 15);
      break;
    case '30min':
      nextSync.setMinutes(now.getMinutes() + 30);
      break;
    case 'hourly':
      nextSync.setHours(now.getHours() + 1);
      break;
    case 'daily':
      nextSync.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      nextSync.setDate(now.getDate() + 7);
      break;
  }

  return nextSync.toISOString();
}

export function shouldRetry(error: Error, retryCount: number, maxRetries: number): boolean {
  if (retryCount >= maxRetries) return false;

  // Don't retry certain types of errors
  const nonRetryableErrors = [
    'authentication_failed',
    'invalid_credentials',
    'insufficient_permissions',
    'not_found',
  ];

  return !nonRetryableErrors.some(msg => error.message.toLowerCase().includes(msg));
}