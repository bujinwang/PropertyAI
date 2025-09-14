import AsyncStorage from '@react-native-async-storage/async-storage';
import { Property, Unit, MaintenanceRequest, PaymentMethod, PaymentTransaction } from '@/types';

const STORAGE_KEYS = {
  PROPERTIES: 'offline_properties',
  UNITS: 'offline_units',
  MAINTENANCE_REQUESTS: 'offline_maintenance_requests',
  PAYMENT_METHODS: 'offline_payment_methods',
  PAYMENT_TRANSACTIONS: 'offline_payment_transactions',
  SYNC_QUEUE: 'offline_sync_queue',
  USER_PREFERENCES: 'offline_user_preferences',
};

interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  data: any;
  createdAt: string;
  retryCount: number;
}

class OfflineStorageService {
  // Generic storage operations
  private async getStoredData<T>(key: string): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting stored data for ${key}:`, error);
      return [];
    }
  }

  private async setStoredData<T>(key: string, data: T[]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error storing data for ${key}:`, error);
      throw error;
    }
  }

  private async updateStoredData<T>(
    key: string,
    updater: (data: T[]) => T[]
  ): Promise<void> {
    const currentData = await this.getStoredData<T>(key);
    const updatedData = updater(currentData);
    await this.setStoredData(key, updatedData);
  }

  // Property operations
  async saveProperty(property: Property): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.PROPERTIES, (properties) => {
      const existingIndex = properties.findIndex((p: any) => p.id === property.id);
      if (existingIndex >= 0) {
        properties[existingIndex] = { ...property, synced: true };
      } else {
        properties.push({ ...property, synced: true });
      }
      return properties;
    });
  }

  async getProperties(): Promise<Property[]> {
    const data = await this.getStoredData<any>(STORAGE_KEYS.PROPERTIES);
    return data.map((item: any) => ({
      ...item,
      images: item.images || [],
      amenities: item.amenities || [],
    }));
  }

  async getPropertyById(id: string): Promise<Property | null> {
    const properties = await this.getProperties();
    return properties.find(p => p.id === id) || null;
  }

  async deleteProperty(id: string): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.PROPERTIES, (properties) =>
      properties.filter((p: any) => p.id !== id)
    );
  }

  // Unit operations
  async saveUnit(unit: Unit): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.UNITS, (units) => {
      const existingIndex = units.findIndex((u: any) => u.id === unit.id);
      if (existingIndex >= 0) {
        units[existingIndex] = { ...unit, synced: true };
      } else {
        units.push({ ...unit, synced: true });
      }
      return units;
    });
  }

  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    const units = await this.getStoredData<any>(STORAGE_KEYS.UNITS);
    return units
      .filter((u: any) => u.propertyId === propertyId)
      .map((unit: any) => ({
        ...unit,
        images: unit.images || [],
        amenities: unit.amenities || [],
      }));
  }

  async deleteUnit(id: string): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.UNITS, (units) =>
      units.filter((u: any) => u.id !== id)
    );
  }

  // Maintenance operations
  async saveMaintenanceRequest(request: MaintenanceRequest): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.MAINTENANCE_REQUESTS, (requests) => {
      const existingIndex = requests.findIndex((r: any) => r.id === request.id);
      if (existingIndex >= 0) {
        requests[existingIndex] = { ...request, synced: true };
      } else {
        requests.push({ ...request, synced: true });
      }
      return requests;
    });
  }

  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const data = await this.getStoredData<any>(STORAGE_KEYS.MAINTENANCE_REQUESTS);
    return data.map((item: any) => ({
      ...item,
      images: item.images || [],
    }));
  }

  async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    const requests = await this.getMaintenanceRequests();
    return requests.find(r => r.id === id) || null;
  }

  async updateMaintenanceStatus(id: string, status: string): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.MAINTENANCE_REQUESTS, (requests) =>
      requests.map((r: any) =>
        r.id === id
          ? { ...r, status: status as any, updatedAt: new Date().toISOString() }
          : r
      )
    );
  }

  // Payment operations
  async savePaymentMethod(method: PaymentMethod): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.PAYMENT_METHODS, (methods) => {
      const existingIndex = methods.findIndex((m: any) => m.id === method.id);
      if (existingIndex >= 0) {
        methods[existingIndex] = { ...method, synced: true };
      } else {
        methods.push({ ...method, synced: true });
      }
      return methods;
    });
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const data = await this.getStoredData<any>(STORAGE_KEYS.PAYMENT_METHODS);
    return data.map((item: any) => ({
      ...item,
      billingAddress: item.billingAddress || undefined,
    }));
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.PAYMENT_METHODS, (methods) =>
      methods.filter((m: any) => m.id !== id)
    );
  }

  async savePaymentTransaction(transaction: PaymentTransaction): Promise<void> {
    await this.updateStoredData<any>(STORAGE_KEYS.PAYMENT_TRANSACTIONS, (transactions) => {
      const existingIndex = transactions.findIndex((t: any) => t.id === transaction.id);
      if (existingIndex >= 0) {
        transactions[existingIndex] = { ...transaction, synced: true };
      } else {
        transactions.push({ ...transaction, synced: true });
      }
      return transactions;
    });
  }

  async getPaymentTransactions(): Promise<PaymentTransaction[]> {
    const data = await this.getStoredData<any>(STORAGE_KEYS.PAYMENT_TRANSACTIONS);
    return data.map((item: any) => ({
      ...item,
      metadata: item.metadata || undefined,
    }));
  }

  // Sync queue operations
  async addToSyncQueue(
    type: 'create' | 'update' | 'delete',
    tableName: string,
    recordId: string,
    data: any
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `${tableName}_${recordId}_${Date.now()}`,
      type,
      tableName,
      recordId,
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    await this.updateStoredData<SyncQueueItem>(STORAGE_KEYS.SYNC_QUEUE, (queue) => {
      queue.push(queueItem);
      return queue;
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return await this.getStoredData<SyncQueueItem>(STORAGE_KEYS.SYNC_QUEUE);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.updateStoredData<SyncQueueItem>(STORAGE_KEYS.SYNC_QUEUE, (queue) =>
      queue.filter(item => item.id !== id)
    );
  }

  async incrementRetryCount(id: string): Promise<void> {
    await this.updateStoredData<SyncQueueItem>(STORAGE_KEYS.SYNC_QUEUE, (queue) =>
      queue.map(item =>
        item.id === id
          ? { ...item, retryCount: item.retryCount + 1 }
          : item
      )
    );
  }

  async clearSyncQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  }

  // User preferences
  async setUserPreference(key: string, value: any): Promise<void> {
    try {
      const preferences = await this.getStoredData<{ key: string; value: any }>(STORAGE_KEYS.USER_PREFERENCES);
      const existingIndex = preferences.findIndex(p => p.key === key);

      if (existingIndex >= 0) {
        preferences[existingIndex] = { key, value };
      } else {
        preferences.push({ key, value });
      }

      await this.setStoredData(STORAGE_KEYS.USER_PREFERENCES, preferences);
    } catch (error) {
      console.error('Error setting user preference:', error);
      throw error;
    }
  }

  async getUserPreference(key: string): Promise<any> {
    try {
      const preferences = await this.getStoredData<{ key: string; value: any }>(STORAGE_KEYS.USER_PREFERENCES);
      const preference = preferences.find(p => p.key === key);
      return preference ? preference.value : null;
    } catch (error) {
      console.error('Error getting user preference:', error);
      return null;
    }
  }

  // Clear all offline data (for logout or reset)
  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }

  // Get storage usage information
  async getStorageInfo(): Promise<{
    totalItems: number;
    storageSize: number;
    lastSync: string | null;
  }> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      let totalItems = 0;
      let storageSize = 0;

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            totalItems += parsed.length;
          } else {
            totalItems += 1;
          }
          storageSize += data.length;
        }
      }

      const lastSync = await this.getUserPreference('last_sync');

      return {
        totalItems,
        storageSize,
        lastSync,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        totalItems: 0,
        storageSize: 0,
        lastSync: null,
      };
    }
  }

  // Sync operations
  async markAsSynced(tableName: string, recordId: string): Promise<void> {
    const key = this.getStorageKeyForTable(tableName);
    if (!key) return;

    await this.updateStoredData<any>(key, (items) =>
      items.map((item: any) =>
        item.id === recordId
          ? { ...item, synced: true }
          : item
      )
    );
  }

  async getUnsyncedItems(tableName: string): Promise<any[]> {
    const key = this.getStorageKeyForTable(tableName);
    if (!key) return [];

    const items = await this.getStoredData<any>(key);
    return items.filter((item: any) => !item.synced);
  }

  private getStorageKeyForTable(tableName: string): string | null {
    switch (tableName) {
      case 'properties':
        return STORAGE_KEYS.PROPERTIES;
      case 'units':
        return STORAGE_KEYS.UNITS;
      case 'maintenance_requests':
        return STORAGE_KEYS.MAINTENANCE_REQUESTS;
      case 'payment_methods':
        return STORAGE_KEYS.PAYMENT_METHODS;
      case 'payment_transactions':
        return STORAGE_KEYS.PAYMENT_TRANSACTIONS;
      default:
        return null;
    }
  }
}

export const offlineStorageService = new OfflineStorageService();