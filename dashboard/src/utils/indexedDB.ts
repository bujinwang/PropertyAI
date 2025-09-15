/**
 * IndexedDB Service for Offline Data Storage
 * Provides persistent storage for offline data synchronization
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

export interface OfflineData {
  id: string;
  type: 'property' | 'tenant' | 'maintenance' | 'analytics' | 'form';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastError?: string;
}

export interface SyncQueueItem {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  lastError?: string;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'PropertyAI_Offline';
  private readonly dbVersion = 1;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  private createObjectStores(db: IDBDatabase): void {
    // Offline data store
    if (!db.objectStoreNames.contains('offlineData')) {
      const offlineDataStore = db.createObjectStore('offlineData', { keyPath: 'id' });
      offlineDataStore.createIndex('type', 'type', { unique: false });
      offlineDataStore.createIndex('synced', 'synced', { unique: false });
      offlineDataStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // Sync queue store
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncQueueStore.createIndex('priority', 'priority', { unique: false });
      syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncQueueStore.createIndex('retryCount', 'retryCount', { unique: false });
    }

    // Cached API responses
    if (!db.objectStoreNames.contains('apiCache')) {
      const apiCacheStore = db.createObjectStore('apiCache', { keyPath: 'url' });
      apiCacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      apiCacheStore.createIndex('expires', 'expires', { unique: false });
    }
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  // Offline Data Management
  async storeOfflineData(data: OfflineData): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');

      const request = store.put({
        ...data,
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      });

      request.onsuccess = () => {
        console.log('[IndexedDB] Offline data stored:', data.id);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to store offline data:', request.error);
        reject(request.error);
      };
    });
  }

  async getOfflineData(type?: string): Promise<OfflineData[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');

      let request: IDBRequest;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const data = request.result as OfflineData[];
        resolve(data.sort((a, b) => b.timestamp - a.timestamp));
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to get offline data:', request.error);
        reject(request.error);
      };
    });
  }

  async markDataSynced(id: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => {
            console.log('[IndexedDB] Data marked as synced:', id);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Data not found, consider it synced
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteOfflineData(id: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');

      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[IndexedDB] Offline data deleted:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to delete offline data:', request.error);
        reject(request.error);
      };
    });
  }

  // Sync Queue Management
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const queueItem: SyncQueueItem = {
      ...item,
      id: `${item.method}_${item.url}_${Date.now()}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      const request = store.put(queueItem);

      request.onsuccess = () => {
        console.log('[IndexedDB] Added to sync queue:', queueItem.id);
        resolve(queueItem.id);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to add to sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');

      const request = store.getAll();

      request.onsuccess = () => {
        const queue = request.result as SyncQueueItem[];
        // Sort by priority (high first) then timestamp (oldest first)
        resolve(queue.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
        }));
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to get sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const updatedItem = { ...item, ...updates };
          const putRequest = store.put(updatedItem);
          putRequest.onsuccess = () => {
            console.log('[IndexedDB] Sync queue item updated:', id);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Sync queue item not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[IndexedDB] Removed from sync queue:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to remove from sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  // API Cache Management
  async cacheAPIResponse(url: string, response: any, ttl: number = 3600000): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const cacheItem = {
      url,
      data: response,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiCache'], 'readwrite');
      const store = transaction.objectStore('apiCache');

      const request = store.put(cacheItem);

      request.onsuccess = () => {
        console.log('[IndexedDB] API response cached:', url);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to cache API response:', request.error);
        reject(request.error);
      };
    });
  }

  async getCachedAPIResponse(url: string): Promise<any | null> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiCache'], 'readonly');
      const store = transaction.objectStore('apiCache');

      const request = store.get(url);

      request.onsuccess = () => {
        const cacheItem = request.result;
        if (cacheItem && cacheItem.expires > Date.now()) {
          resolve(cacheItem.data);
        } else {
          if (cacheItem) {
            // Remove expired item
            const deleteTransaction = this.db!.transaction(['apiCache'], 'readwrite');
            const deleteStore = deleteTransaction.objectStore('apiCache');
            deleteStore.delete(url);
          }
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to get cached API response:', request.error);
        reject(request.error);
      };
    });
  }

  // Cleanup methods
  async cleanupExpiredCache(): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiCache'], 'readwrite');
      const store = transaction.objectStore('apiCache');
      const index = store.index('expires');

      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        console.log('[IndexedDB] Expired cache cleaned up');
        resolve();
      };

      transaction.onerror = () => {
        console.error('[IndexedDB] Cache cleanup failed:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  async clearAllData(): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const stores = ['offlineData', 'syncQueue', 'apiCache'];

    const clearPromises = stores.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(clearPromises);
    console.log('[IndexedDB] All data cleared');
  }
}

// Global instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;
export { IndexedDBService };