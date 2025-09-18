#!/usr/bin/env node

/**
 * Migration Rollback Script
 * Safely rolls back Sequelize to Prisma migration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class MigrationRollback {
  constructor() {
    this.prisma = new PrismaClient();
    this.backupPath = './backups/migration_backup.json';
    this.rollbackLog = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    this.rollbackLog.push(logEntry);
  }

  async loadBackup() {
    try {
      const backupData = await fs.readFile(this.backupPath, 'utf8');
      return JSON.parse(backupData);
    } catch (error) {
      throw new Error(`Could not load backup file: ${error.message}`);
    }
  }

  async clearPrismaData() {
    this.log('🧹 Clearing migrated data from Prisma...');

    try {
      // Clear in reverse order of dependencies
      await this.prisma.payment.deleteMany();
      this.log('✅ Cleared payments');

      await this.prisma.invoice.deleteMany();
      this.log('✅ Cleared invoices');

      await this.prisma.maintenanceHistory.deleteMany();
      this.log('✅ Cleared maintenance history');

      await this.prisma.property.deleteMany();
      this.log('✅ Cleared properties');

      await this.prisma.tenant.deleteMany();
      this.log('✅ Cleared tenants');

      this.log('✅ All Prisma data cleared');
    } catch (error) {
      this.log(`❌ Error clearing Prisma data: ${error.message}`);
      throw error;
    }
  }

  async restoreFromBackup() {
    this.log('🔄 Restoring data from backup...');

    const backup = await this.loadBackup();

    try {
      // Restore in dependency order
      await this.restoreTenants(backup.data.tenants || []);
      await this.restoreProperties(backup.data.properties || []);
      await this.restoreInvoices(backup.data.invoices || []);
      await this.restorePayments(backup.data.payments || []);
      await this.restoreMaintenanceHistory(backup.data.maintenance_history || []);

      this.log('✅ Data restoration completed');
    } catch (error) {
      this.log(`❌ Error during restoration: ${error.message}`);
      throw error;
    }
  }

  async restoreTenants(tenants) {
    let restored = 0;
    for (const tenant of tenants) {
      try {
        await this.prisma.tenant.create({ data: tenant });
        restored++;
      } catch (error) {
        this.log(`❌ Failed to restore tenant ${tenant.id}: ${error.message}`);
      }
    }
    this.log(`✅ Restored ${restored}/${tenants.length} tenants`);
  }

  async restoreProperties(properties) {
    let restored = 0;
    for (const property of properties) {
      try {
        await this.prisma.property.create({ data: property });
        restored++;
      } catch (error) {
        this.log(`❌ Failed to restore property ${property.id}: ${error.message}`);
      }
    }
    this.log(`✅ Restored ${restored}/${properties.length} properties`);
  }

  async restoreInvoices(invoices) {
    let restored = 0;
    for (const invoice of invoices) {
      try {
        await this.prisma.invoice.create({ data: invoice });
        restored++;
      } catch (error) {
        this.log(`❌ Failed to restore invoice ${invoice.id}: ${error.message}`);
      }
    }
    this.log(`✅ Restored ${restored}/${invoices.length} invoices`);
  }

  async restorePayments(payments) {
    let restored = 0;
    for (const payment of payments) {
      try {
        await this.prisma.payment.create({ data: payment });
        restored++;
      } catch (error) {
        this.log(`❌ Failed to restore payment ${payment.id}: ${error.message}`);
      }
    }
    this.log(`✅ Restored ${restored}/${payments.length} payments`);
  }

  async restoreMaintenanceHistory(records) {
    let restored = 0;
    for (const record of records) {
      try {
        await this.prisma.maintenanceHistory.create({ data: record });
        restored++;
      } catch (error) {
        this.log(`❌ Failed to restore maintenance record ${record.id}: ${error.message}`);
      }
    }
    this.log(`✅ Restored ${restored}/${records.length} maintenance records`);
  }

  async validateRollback() {
    this.log('🔍 Validating rollback...');

    const backup = await this.loadBackup();

    const validation = {
      tenants: { backup: backup.data.tenants?.length || 0, restored: 0 },
      properties: { backup: backup.data.properties?.length || 0, restored: 0 },
      invoices: { backup: backup.data.invoices?.length || 0, restored: 0 },
      payments: { backup: backup.data.payments?.length || 0, restored: 0 },
      maintenance: { backup: backup.data.maintenance_history?.length || 0, restored: 0 }
    };

    // Count restored records
    validation.tenants.restored = await this.prisma.tenant.count();
    validation.properties.restored = await this.prisma.property.count();
    validation.invoices.restored = await this.prisma.invoice.count();
    validation.payments.restored = await this.prisma.payment.count();
    validation.maintenance.restored = await this.prisma.maintenanceHistory.count();

    // Report validation results
    this.log('\n📊 Rollback Validation Results:');
    this.log('=====================================');

    for (const [table, counts] of Object.entries(validation)) {
      const match = counts.backup === counts.restored;
      const status = match ? '✅' : '❌';
      this.log(`${status} ${table}: Backup=${counts.backup}, Restored=${counts.restored}`);
    }

    return validation;
  }

  async generateRollbackReport(validation) {
    const report = {
      timestamp: new Date().toISOString(),
      operation: 'Migration Rollback',
      version: '1.0',
      validation,
      logs: this.rollbackLog
    };

    await fs.writeFile('./rollback-report.json', JSON.stringify(report, null, 2));
  }

  async runRollback() {
    console.log('🔄 Starting Migration Rollback...\n');

    try {
      await this.prisma.$connect();
      this.log('✅ Prisma connection established');

      // Check if backup exists
      try {
        await fs.access(this.backupPath);
      } catch (error) {
        throw new Error(`Backup file not found at ${this.backupPath}. Cannot proceed with rollback.`);
      }

      // Clear migrated data
      await this.clearPrismaData();

      // Restore from backup
      await this.restoreFromBackup();

      // Validate rollback
      const validation = await this.validateRollback();

      // Generate report
      await this.generateRollbackReport(validation);

      console.log('\n✅ Rollback completed successfully!');
      console.log('📋 Check rollback-report.json for detailed results');

    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      console.log('🔄 You may need to manually restore from backup');
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run rollback if called directly
if (require.main === module) {
  const rollback = new MigrationRollback();
  rollback.runRollback().catch(console.error);
}

module.exports = MigrationRollback;