import AsyncStorage from '@react-native-async-storage/async-storage';
import httpClient from './httpClient';
import { AxiosRequestConfig } from 'axios';

/**
 * Queued request interface
 */
interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  metadata?: {
    entityType?: string;
    entityId?: string;
    description?: string;
  };
}

/**
 * Sync queue configuration
 */
interface SyncQueueConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  storageKey: string;
}

const DEFAULT_CONFIG: SyncQueueConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  storageKey: '@sync_queue',
};

/**
 * Offline Sync Queue Service
 * Handles queueing and retrying failed requests when offline
 */
class SyncQueueService {
  private config: SyncQueueConfig;
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private listeners: ((queue: QueuedRequest[]) => void)[] = [];

  constructor(config: Partial<SyncQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadQueue();
  }

  /**
   * Add a request to the sync queue
   */
  async addToQueue(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data?: any,
    options?: {
      headers?: Record<string, string>;
      maxRetries?: number;
      metadata?: QueuedRequest['metadata'];
    }
  ): Promise<string> {
    const request: QueuedRequest = {
      id: this.generateId(),
      url,
      method,
      data,
      headers: options?.headers,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options?.maxRetries || this.config.maxRetries,
      metadata: options?.metadata,
    };

    this.queue.push(request);
    await this.saveQueue();
    this.notifyListeners();

    console.log(`[SyncQueue] Added request to queue: ${method} ${url}`, request.metadata);

    return request.id;
  }

  /**
   * Process the sync queue
   * Attempts to send all queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[SyncQueue] Processing ${this.queue.length} queued requests...`);

    const requestsToProcess = [...this.queue];
    
    for (const request of requestsToProcess) {
      try {
        await this.processRequest(request);
        // Success - remove from queue
        this.removeFromQueue(request.id);
      } catch (error) {
        // Failed - handle retry or removal
        await this.handleFailedRequest(request, error);
      }
    }

    await this.saveQueue();
    this.notifyListeners();
    this.isProcessing = false;

    console.log(`[SyncQueue] Processing complete. ${this.queue.length} requests remaining.`);
  }

  /**
   * Process a single request
   */
  private async processRequest(request: QueuedRequest): Promise<void> {
    const config: AxiosRequestConfig = {
      method: request.method,
      url: request.url,
      data: request.data,
      headers: request.headers,
    };

    await httpClient.request(config);
    console.log(`[SyncQueue] Successfully processed: ${request.method} ${request.url}`);
  }

  /**
   * Handle a failed request
   */
  private async handleFailedRequest(request: QueuedRequest, error: any): Promise<void> {
    request.retryCount++;

    if (request.retryCount >= request.maxRetries) {
      // Max retries reached - remove from queue
      console.warn(
        `[SyncQueue] Max retries reached for: ${request.method} ${request.url}`,
        request.metadata
      );
      this.removeFromQueue(request.id);
    } else {
      // Calculate exponential backoff delay
      const delay = this.calculateBackoff(request.retryCount);
      console.log(
        `[SyncQueue] Failed (attempt ${request.retryCount}/${request.maxRetries}): ${request.method} ${request.url}. Will retry in ${delay}ms`
      );

      // Update request in queue
      const index = this.queue.findIndex((r) => r.id === request.id);
      if (index !== -1) {
        this.queue[index] = request;
      }
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(2, retryCount - 1);
    // Add jitter (random factor) to prevent thundering herd
    const jitter = Math.random() * 1000;
    const delay = Math.min(exponentialDelay + jitter, this.config.maxDelay);
    return delay;
  }

  /**
   * Remove a request from the queue
   */
  private removeFromQueue(id: string): void {
    this.queue = this.queue.filter((r) => r.id !== id);
  }

  /**
   * Clear all queued requests
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
    console.log('[SyncQueue] Queue cleared');
  }

  /**
   * Get all queued requests
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if queue has pending requests
   */
  hasPendingRequests(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Remove a specific request by ID
   */
  async removeRequest(id: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.removeFromQueue(id);
    
    if (this.queue.length < initialLength) {
      await this.saveQueue();
      this.notifyListeners();
      return true;
    }
    
    return false;
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: QueuedRequest[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    const queue = this.getQueue();
    this.listeners.forEach((listener) => {
      try {
        listener(queue);
      } catch (error) {
        console.error('[SyncQueue] Error in listener:', error);
      }
    });
  }

  /**
   * Load queue from persistent storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(this.config.storageKey);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        console.log(`[SyncQueue] Loaded ${this.queue.length} requests from storage`);
      }
    } catch (error) {
      console.error('[SyncQueue] Error loading queue from storage:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to persistent storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.config.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[SyncQueue] Error saving queue to storage:', error);
    }
  }

  /**
   * Generate unique ID for requests
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get failed requests (requests that have been retried at least once)
   */
  getFailedRequests(): QueuedRequest[] {
    return this.queue.filter((r) => r.retryCount > 0);
  }

  /**
   * Get requests by metadata
   */
  getRequestsByMetadata(entityType: string, entityId?: string): QueuedRequest[] {
    return this.queue.filter((r) => {
      if (!r.metadata) return false;
      if (r.metadata.entityType !== entityType) return false;
      if (entityId && r.metadata.entityId !== entityId) return false;
      return true;
    });
  }
}

// Export singleton instance
export const syncQueueService = new SyncQueueService();
export default syncQueueService;
