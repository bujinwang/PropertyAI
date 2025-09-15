/**
 * Offline Manager Service
 * Coordinates offline data storage, synchronization, and UI indicators
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import indexedDBService, { type OfflineData, type SyncQueueItem } from './indexedDB';
import { isOnline, onNetworkChange, requestBackgroundSync, sendSWMessage } from './serviceWorker';

export interface OfflineStatus {
  isOnline: boolean;
  hasPendingSync: boolean;
  offlineDataCount: number;
  lastSyncTime?: number;
  syncInProgress: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
}

class OfflineManager {
  private statusListeners: ((status: OfflineStatus) => void)[] = [];
  private currentStatus: OfflineStatus = {
    isOnline: true,
    hasPendingSync: false,
    offlineDataCount: 0,
    syncInProgress: false
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Set initial online status
    this.currentStatus.isOnline = isOnline();

    // Listen for network changes
    onNetworkChange((online) => {
      console.log('[OfflineManager] Network status changed:', online ? 'online' : 'offline');
      this.updateStatus({ isOnline: online });

      if (online) {
        // Trigger sync when coming back online
        this.syncOfflineData();
      }
    });

    // Load initial offline data count
    await this.updateOfflineDataCount();

    // Check for pending sync items
    await this.checkPendingSync();

    // Notify initial status
    this.notifyStatusChange();
  }

  // Status Management
  private updateStatus(updates: Partial<OfflineStatus>) {
    this.currentStatus = { ...this.currentStatus, ...updates };
    this.notifyStatusChange();
  }

  private notifyStatusChange() {
    this.statusListeners.forEach(callback => callback(this.currentStatus));
  }

  public onStatusChange(callback: (status: OfflineStatus) => void) {
    this.statusListeners.push(callback);
    // Immediately call with current status
    callback(this.currentStatus);
  }

  public removeStatusChangeListener(callback: (status: OfflineStatus) => void) {
    const index = this.statusListeners.indexOf(callback);
    if (index > -1) {
      this.statusListeners.splice(index, 1);
    }
  }

  public getStatus(): OfflineStatus {
    return { ...this.currentStatus };
  }

  // Offline Data Management
  async storeOfflineData(type: OfflineData['type'], data: any, id?: string): Promise<string> {
    const offlineDataId = id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const offlineData: OfflineData = {
      id: offlineDataId,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };

    await indexedDBService.storeOfflineData(offlineData);
    await this.updateOfflineDataCount();

    console.log('[OfflineManager] Stored offline data:', offlineDataId);
    return offlineDataId;
  }

  async getOfflineData(type?: OfflineData['type']): Promise<OfflineData[]> {
    return indexedDBService.getOfflineData(type);
  }

  async deleteOfflineData(id: string): Promise<void> {
    await indexedDBService.deleteOfflineData(id);
    await this.updateOfflineDataCount();
  }

  // Sync Queue Management
  async queueForSync(
    method: SyncQueueItem['method'],
    url: string,
    data: any,
    priority: SyncQueueItem['priority'] = 'medium'
  ): Promise<string> {
    const id = await indexedDBService.addToSyncQueue({
      method,
      url,
      data,
      priority
    });

    await this.checkPendingSync();
    console.log('[OfflineManager] Queued for sync:', id);

    // If online, try to sync immediately
    if (this.currentStatus.isOnline && !this.currentStatus.syncInProgress) {
      this.syncOfflineData();
    }

    return id;
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return indexedDBService.getSyncQueue();
  }

  // Synchronization
  async syncOfflineData(): Promise<SyncResult> {
    if (this.currentStatus.syncInProgress) {
      console.log('[OfflineManager] Sync already in progress');
      return { success: false, syncedItems: 0, failedItems: 0, errors: ['Sync already in progress'] };
    }

    if (!this.currentStatus.isOnline) {
      console.log('[OfflineManager] Cannot sync while offline');
      return { success: false, syncedItems: 0, failedItems: 0, errors: ['Offline'] };
    }

    this.updateStatus({ syncInProgress: true });

    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      const syncQueue = await this.getSyncQueue();

      for (const item of syncQueue) {
        try {
          const response = await this.attemptSync(item);

          if (response.ok) {
            await indexedDBService.removeFromSyncQueue(item.id);
            result.syncedItems++;
            console.log('[OfflineManager] Successfully synced:', item.id);
          } else {
            await this.handleSyncFailure(item, `HTTP ${response.status}`);
            result.failedItems++;
          }
        } catch (error) {
          await this.handleSyncFailure(item, error instanceof Error ? error.message : 'Unknown error');
          result.failedItems++;
        }
      }

      // Update sync status
      await this.checkPendingSync();
      this.updateStatus({
        lastSyncTime: Date.now(),
        syncInProgress: false
      });

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Sync failed');
      this.updateStatus({ syncInProgress: false });
    }

    return result;
  }

  private async attemptSync(item: SyncQueueItem): Promise<Response> {
    const options: RequestInit = {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (item.method !== 'DELETE' && item.data) {
      options.body = JSON.stringify(item.data);
    }

    return fetch(item.url, options);
  }

  private async handleSyncFailure(item: SyncQueueItem, error: string): Promise<void> {
    const maxRetries = 3;

    if (item.retryCount < maxRetries) {
      // Increment retry count and keep in queue
      await indexedDBService.updateSyncQueueItem(item.id, {
        retryCount: item.retryCount + 1,
        lastError: error
      });
      console.log(`[OfflineManager] Sync failed, retry ${item.retryCount + 1}/${maxRetries}:`, item.id);
    } else {
      // Max retries reached, remove from queue
      await indexedDBService.removeFromSyncQueue(item.id);
      console.log('[OfflineManager] Sync failed permanently, removed from queue:', item.id);
    }
  }

  // Background Sync
  async requestBackgroundSync(): Promise<boolean> {
    if (!this.currentStatus.hasPendingSync) {
      console.log('[OfflineManager] No pending sync items');
      return false;
    }

    return requestBackgroundSync('offline-sync');
  }

  // Cache Management
  async cacheAPIResponse(url: string, response: any, ttl: number = 3600000): Promise<void> {
    await indexedDBService.cacheAPIResponse(url, response, ttl);
  }

  async getCachedAPIResponse(url: string): Promise<any | null> {
    return indexedDBService.getCachedAPIResponse(url);
  }

  // Utility Methods
  private async updateOfflineDataCount(): Promise<void> {
    try {
      const offlineData = await indexedDBService.getOfflineData();
      const unsyncedCount = offlineData.filter(item => !item.synced).length;
      this.updateStatus({ offlineDataCount: unsyncedCount });
    } catch (error) {
      console.error('[OfflineManager] Failed to update offline data count:', error);
    }
  }

  private async checkPendingSync(): Promise<void> {
    try {
      const syncQueue = await indexedDBService.getSyncQueue();
      const hasPending = syncQueue.length > 0;
      this.updateStatus({ hasPendingSync: hasPending });
    } catch (error) {
      console.error('[OfflineManager] Failed to check pending sync:', error);
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await indexedDBService.cleanupExpiredCache();
    console.log('[OfflineManager] Cleanup completed');
  }

  async clearAllData(): Promise<void> {
    await indexedDBService.clearAllData();
    await this.updateOfflineDataCount();
    await this.checkPendingSync();
    console.log('[OfflineManager] All offline data cleared');
  }

  // Service Worker Communication
  async sendMessageToSW(message: any): Promise<any> {
    return sendSWMessage(message);
  }
}

// Global instance
const offlineManager = new OfflineManager();

export default offlineManager;
export { OfflineManager };