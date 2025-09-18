#!/usr/bin/env node

/**
 * Migration Runner
 * User-friendly interface for Sequelize to Prisma migration
 */

const { SequelizeToPrismaMigrator } = require('./scripts/migrate-sequelize-to-prisma');
const { MigrationRollback } = require('./scripts/rollback-migration');
const fs = require('fs').promises;
const path = require('path');

class MigrationRunner {
  constructor() {
    this.migrator = null;
    this.rollback = null;
  }

  displayHeader() {
    console.log('\n🚀 Sequelize to Prisma Migration Tool');
    console.log('=====================================');
    console.log('This tool safely migrates your data from Sequelize to Prisma\n');
  }

  displayMenu() {
    console.log('Available Options:');
    console.log('==================');
    console.log('1. 🚀 Run Full Migration (Sequelize → Prisma)');
    console.log('2. 🔄 Rollback Migration (Prisma → Sequelize)');
    console.log('3. 📊 Check Migration Status');
    console.log('4. 🔍 Validate Current Data');
    console.log('5. 📋 View Migration Report');
    console.log('6. ❌ Exit\n');
  }

  async runFullMigration() {
    console.log('\n⚠️  IMPORTANT: This will migrate ALL data from Sequelize to Prisma');
    console.log('A backup will be created automatically before migration begins.\n');

    const confirm = await this.getUserConfirmation('Do you want to proceed with the migration? (yes/no): ');
    if (!confirm) {
      console.log('Migration cancelled.');
      return;
    }

    try {
      this.migrator = new SequelizeToPrismaMigrator();
      await this.migrator.runMigration();
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      console.log('\n🔄 You can rollback using option 2, or check the logs for details.');
    }
  }

  async runRollback() {
    console.log('\n⚠️  IMPORTANT: This will rollback ALL migrated data');
    console.log('Data will be restored from the backup created during migration.\n');

    const confirm = await this.getUserConfirmation('Do you want to proceed with the rollback? (yes/no): ');
    if (!confirm) {
      console.log('Rollback cancelled.');
      return;
    }

    try {
      this.rollback = new MigrationRollback();
      await this.rollback.runRollback();
    } catch (error) {
      console.error('\n❌ Rollback failed:', error.message);
      console.log('\n📞 Contact support if you need manual data restoration.');
    }
  }

  async checkMigrationStatus() {
    console.log('\n📊 Migration Status Check');
    console.log('=========================\n');

    // Check for migration report
    try {
      const reportPath = './migration-report.json';
      await fs.access(reportPath);
      const reportData = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportData);

      console.log('✅ Migration report found');
      console.log(`📅 Last migration: ${new Date(report.timestamp).toLocaleString()}`);
      console.log(`📊 Version: ${report.version}\n`);

      console.log('Migration Results:');
      for (const [table, result] of Object.entries(report.results)) {
        console.log(`  ${table}: ${result.migrated} migrated, ${result.skipped} skipped`);
      }

      console.log('\nValidation Results:');
      for (const [table, counts] of Object.entries(report.validation)) {
        const match = counts.sequelize === counts.prisma;
        const status = match ? '✅' : '❌';
        console.log(`  ${status} ${table}: Sequelize=${counts.sequelize}, Prisma=${counts.prisma}`);
      }

    } catch (error) {
      console.log('❌ No migration report found. Migration may not have been run yet.');
    }

    // Check for backup
    try {
      const backupPath = './backups/migration_backup.json';
      await fs.access(backupPath);
      const backupData = await fs.readFile(backupPath, 'utf8');
      const backup = JSON.parse(backupData);

      console.log('\n✅ Backup found');
      console.log(`📅 Backup created: ${new Date(backup.timestamp).toLocaleString()}`);

      let totalRecords = 0;
      for (const [table, records] of Object.entries(backup.data)) {
        console.log(`  ${table}: ${records.length} records`);
        totalRecords += records.length;
      }
      console.log(`\n📊 Total backed up records: ${totalRecords}`);

    } catch (error) {
      console.log('\n❌ No backup found. Create a backup before running migration.');
    }
  }

  async validateCurrentData() {
    console.log('\n🔍 Data Validation');
    console.log('==================\n');

    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.$connect();

      const counts = {
        tenants: await prisma.tenant.count(),
        properties: await prisma.property.count(),
        invoices: await prisma.invoice.count(),
        payments: await prisma.payment.count(),
        maintenance: await prisma.maintenanceHistory.count()
      };

      console.log('Current Prisma Data:');
      console.log('===================');
      for (const [table, count] of Object.entries(counts)) {
        console.log(`  ${table}: ${count} records`);
      }

      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      console.log(`\n📊 Total records in Prisma: ${total}`);

      await prisma.$disconnect();

    } catch (error) {
      console.error('❌ Could not validate data:', error.message);
    }
  }

  async viewMigrationReport() {
    console.log('\n📋 Migration Report');
    console.log('===================\n');

    try {
      const reportPath = './migration-report.json';
      const reportData = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportData);

      console.log('Migration Summary:');
      console.log('==================');
      console.log(`Timestamp: ${new Date(report.timestamp).toLocaleString()}`);
      console.log(`Version: ${report.version}`);
      console.log(`Migration: ${report.migration}\n`);

      console.log('Detailed Results:');
      console.log('=================');
      for (const [table, result] of Object.entries(report.results)) {
        console.log(`${table}:`);
        console.log(`  Migrated: ${result.migrated}`);
        console.log(`  Skipped: ${result.skipped}`);
        console.log(`  Total: ${result.migrated + result.skipped}\n`);
      }

      console.log('Data Validation:');
      console.log('================');
      for (const [table, counts] of Object.entries(report.validation)) {
        const match = counts.sequelize === counts.prisma;
        const status = match ? '✅ Match' : '❌ Mismatch';
        console.log(`${table}: ${status} (${counts.sequelize} → ${counts.prisma})`);
      }

    } catch (error) {
      console.log('❌ Could not load migration report:', error.message);
      console.log('Run a migration first to generate a report.');
    }
  }

  async getUserConfirmation(prompt) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  async run() {
    this.displayHeader();

    while (true) {
      this.displayMenu();

      const choice = await this.getUserInput('Enter your choice (1-6): ');

      switch (choice) {
        case '1':
          await this.runFullMigration();
          break;
        case '2':
          await this.runRollback();
          break;
        case '3':
          await this.checkMigrationStatus();
          break;
        case '4':
          await this.validateCurrentData();
          break;
        case '5':
          await this.viewMigrationReport();
          break;
        case '6':
          console.log('\n👋 Goodbye!');
          process.exit(0);
        default:
          console.log('❌ Invalid choice. Please select 1-6.');
      }

      console.log('\n' + '='.repeat(50) + '\n');
    }
  }

  async getUserInput(prompt) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}

// Environment validation
function validateEnvironment() {
  const required = [
    'SEQUELIZE_DB_HOST',
    'SEQUELIZE_DB_NAME',
    'SEQUELIZE_DB_USER',
    'SEQUELIZE_DB_PASSWORD',
    'DATABASE_URL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    console.error('Example:');
    console.error('  SEQUELIZE_DB_HOST=localhost');
    console.error('  SEQUELIZE_DB_NAME=propertyai_sequelize');
    console.error('  SEQUELIZE_DB_USER=postgres');
    console.error('  SEQUELIZE_DB_PASSWORD=your_password');
    console.error('  DATABASE_URL="postgresql://user:pass@localhost:5432/propertyai_prisma"');
    process.exit(1);
  }
}

// Run the migration runner
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();

  // Validate environment
  validateEnvironment();

  const runner = new MigrationRunner();
  runner.run().catch(console.error);
}

module.exports = MigrationRunner;