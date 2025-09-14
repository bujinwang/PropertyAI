import * as SQLite from 'expo-sqlite';
import { Property, Unit, MaintenanceRequest, PaymentMethod, PaymentTransaction } from '@/types';

const DATABASE_NAME = 'propertyai.db';
const DATABASE_VERSION = 1;

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = SQLite.openDatabase(DATABASE_NAME);

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const queries = [
      // Properties table
      `CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zipCode TEXT NOT NULL,
        country TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        totalUnits INTEGER NOT NULL,
        occupiedUnits INTEGER NOT NULL,
        monthlyRent REAL NOT NULL,
        images TEXT, -- JSON string
        amenities TEXT, -- JSON string
        description TEXT,
        managerId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        synced INTEGER DEFAULT 0 -- 0: not synced, 1: synced
      )`,

      // Units table
      `CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        propertyId TEXT NOT NULL,
        unitNumber TEXT NOT NULL,
        floor INTEGER,
        bedrooms INTEGER NOT NULL,
        bathrooms REAL NOT NULL,
        squareFeet INTEGER NOT NULL,
        monthlyRent REAL NOT NULL,
        status TEXT NOT NULL,
        isAvailable INTEGER NOT NULL,
        availableDate TEXT,
        images TEXT, -- JSON string
        amenities TEXT, -- JSON string
        description TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (propertyId) REFERENCES properties (id)
      )`,

      // Maintenance requests table
      `CREATE TABLE IF NOT EXISTS maintenance_requests (
        id TEXT PRIMARY KEY,
        unitId TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        propertyId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        images TEXT, -- JSON string
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        scheduledDate TEXT,
        completedDate TEXT,
        assignedTo TEXT,
        estimatedCost REAL,
        actualCost REAL,
        notes TEXT,
        synced INTEGER DEFAULT 0
      )`,

      // Payment methods table
      `CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        last4 TEXT NOT NULL,
        brand TEXT NOT NULL,
        expiryMonth INTEGER NOT NULL,
        expiryYear INTEGER NOT NULL,
        isDefault INTEGER NOT NULL,
        billingAddress TEXT, -- JSON string
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )`,

      // Payment transactions table
      `CREATE TABLE IF NOT EXISTS payment_transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        paymentMethodId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        processedAt TEXT,
        metadata TEXT, -- JSON string
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (paymentMethodId) REFERENCES payment_methods (id)
      )`,

      // Sync queue table for offline actions
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- 'create', 'update', 'delete'
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data TEXT NOT NULL, -- JSON string
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0
      )`,

      // User preferences table
      `CREATE TABLE IF NOT EXISTS user_preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    ];

    for (const query of queries) {
      await this.executeSql(query);
    }
  }

  // Generic SQL execution
  private async executeSql(sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Property operations
  async saveProperty(property: Property): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO properties
      (id, name, address, city, state, zipCode, country, type, status,
       totalUnits, occupiedUnits, monthlyRent, images, amenities, description,
       managerId, createdAt, updatedAt, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      property.id,
      property.name,
      property.address,
      property.city,
      property.state,
      property.zipCode,
      property.country,
      property.type,
      property.status,
      property.totalUnits,
      property.occupiedUnits,
      property.monthlyRent,
      JSON.stringify(property.images),
      JSON.stringify(property.amenities),
      property.description,
      property.managerId,
      property.createdAt,
      property.updatedAt,
      1 // synced
    ];

    await this.executeSql(sql, params);
  }

  async getProperties(): Promise<Property[]> {
    const result = await this.executeSql('SELECT * FROM properties ORDER BY updatedAt DESC');
    return result.rows._array.map(row => ({
      ...row,
      images: JSON.parse(row.images || '[]'),
      amenities: JSON.parse(row.amenities || '[]'),
    }));
  }

  async getPropertyById(id: string): Promise<Property | null> {
    const result = await this.executeSql('SELECT * FROM properties WHERE id = ?', [id]);
    if (result.rows.length === 0) return null;

    const row = result.rows.item(0);
    return {
      ...row,
      images: JSON.parse(row.images || '[]'),
      amenities: JSON.parse(row.amenities || '[]'),
    };
  }

  // Unit operations
  async saveUnit(unit: Unit): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO units
      (id, propertyId, unitNumber, floor, bedrooms, bathrooms, squareFeet,
       monthlyRent, status, isAvailable, availableDate, images, amenities,
       description, createdAt, updatedAt, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      unit.id,
      unit.propertyId,
      unit.unitNumber,
      unit.floor,
      unit.bedrooms,
      unit.bathrooms,
      unit.squareFeet,
      unit.monthlyRent,
      unit.status,
      unit.isAvailable ? 1 : 0,
      unit.availableDate,
      JSON.stringify(unit.images),
      JSON.stringify(unit.amenities),
      unit.description,
      new Date().toISOString(),
      new Date().toISOString(),
      1
    ];

    await this.executeSql(sql, params);
  }

  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    const result = await this.executeSql('SELECT * FROM units WHERE propertyId = ? ORDER BY unitNumber', [propertyId]);
    return result.rows._array.map(row => ({
      ...row,
      isAvailable: row.isAvailable === 1,
      images: JSON.parse(row.images || '[]'),
      amenities: JSON.parse(row.amenities || '[]'),
    }));
  }

  // Maintenance operations
  async saveMaintenanceRequest(request: MaintenanceRequest): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO maintenance_requests
      (id, unitId, tenantId, propertyId, title, description, category, priority,
       status, images, createdAt, updatedAt, scheduledDate, completedDate,
       assignedTo, estimatedCost, actualCost, notes, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      request.id,
      request.unitId,
      request.tenantId,
      request.propertyId,
      request.title,
      request.description,
      request.category,
      request.priority,
      request.status,
      JSON.stringify(request.images),
      request.createdAt,
      request.updatedAt,
      request.scheduledDate,
      request.completedDate,
      request.assignedTo,
      request.estimatedCost,
      request.actualCost,
      request.notes,
      1
    ];

    await this.executeSql(sql, params);
  }

  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const result = await this.executeSql('SELECT * FROM maintenance_requests ORDER BY createdAt DESC');
    return result.rows._array.map(row => ({
      ...row,
      images: JSON.parse(row.images || '[]'),
    }));
  }

  // Payment operations
  async savePaymentMethod(method: PaymentMethod): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO payment_methods
      (id, type, last4, brand, expiryMonth, expiryYear, isDefault, billingAddress,
       createdAt, updatedAt, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      method.id,
      method.type,
      method.last4,
      method.brand,
      method.expiryMonth,
      method.expiryYear,
      method.isDefault ? 1 : 0,
      JSON.stringify(method.billingAddress),
      new Date().toISOString(),
      new Date().toISOString(),
      1
    ];

    await this.executeSql(sql, params);
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const result = await this.executeSql('SELECT * FROM payment_methods ORDER BY createdAt DESC');
    return result.rows._array.map(row => ({
      ...row,
      isDefault: row.isDefault === 1,
      billingAddress: JSON.parse(row.billingAddress || 'null'),
    }));
  }

  // Sync queue operations
  async addToSyncQueue(type: 'create' | 'update' | 'delete', tableName: string, recordId: string, data: any): Promise<void> {
    const sql = `
      INSERT INTO sync_queue (type, table_name, record_id, data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      type,
      tableName,
      recordId,
      JSON.stringify(data),
      new Date().toISOString()
    ];

    await this.executeSql(sql, params);
  }

  async getSyncQueue(): Promise<any[]> {
    const result = await this.executeSql('SELECT * FROM sync_queue ORDER BY created_at ASC');
    return result.rows._array.map(row => ({
      ...row,
      data: JSON.parse(row.data),
    }));
  }

  async removeFromSyncQueue(id: number): Promise<void> {
    await this.executeSql('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async incrementRetryCount(id: number): Promise<void> {
    await this.executeSql('UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?', [id]);
  }

  // User preferences
  async setUserPreference(key: string, value: any): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
      VALUES (?, ?, ?)
    `;

    await this.executeSql(sql, [key, JSON.stringify(value), new Date().toISOString()]);
  }

  async getUserPreference(key: string): Promise<any> {
    const result = await this.executeSql('SELECT value FROM user_preferences WHERE key = ?', [key]);
    if (result.rows.length === 0) return null;

    return JSON.parse(result.rows.item(0).value);
  }

  // Clear all data (for logout)
  async clearAllData(): Promise<void> {
    const tables = [
      'properties',
      'units',
      'maintenance_requests',
      'payment_methods',
      'payment_transactions',
      'sync_queue',
      'user_preferences'
    ];

    for (const table of tables) {
      await this.executeSql(`DELETE FROM ${table}`);
    }
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      this.db.closeAsync();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();