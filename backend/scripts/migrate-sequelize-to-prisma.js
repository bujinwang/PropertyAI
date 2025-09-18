#!/usr/bin/env node

/**
 * Sequelize to Prisma Migration Script
 * Safely migrates data from Sequelize models to Prisma schema
 */

const { PrismaClient } = require('@prisma/client');
const { Sequelize, DataTypes, Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

class SequelizeToPrismaMigrator {
  constructor() {
    this.prisma = new PrismaClient();
    this.sequelize = null;
    this.migrationLog = [];
    this.backupPath = './backups/migration_backup.json';
  }

  async initializeSequelize() {
    // Initialize Sequelize with existing configuration
    this.sequelize = new Sequelize({
      dialect: 'postgresql',
      host: process.env.SEQUELIZE_DB_HOST || 'localhost',
      port: process.env.SEQUELIZE_DB_PORT || 5432,
      database: process.env.SEQUELIZE_DB_NAME || 'propertyai_sequelize',
      username: process.env.SEQUELIZE_DB_USER || 'postgres',
      password: process.env.SEQUELIZE_DB_PASSWORD || 'postgres',
      logging: (msg) => this.log(`Sequelize: ${msg}`),
    });

    await this.sequelize.authenticate();
    this.log('✅ Sequelize connection established');
  }

  async initializePrisma() {
    await this.prisma.$connect();
    this.log('✅ Prisma connection established');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    this.migrationLog.push(logEntry);
  }

  async createBackup() {
    this.log('📦 Creating data backup...');

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // Backup key tables
    const tables = ['tenants', 'properties', 'invoices', 'payments', 'maintenance_history'];

    for (const table of tables) {
      try {
        const [results] = await this.sequelize.query(`SELECT * FROM ${table}`);
        backup.data[table] = results;
        this.log(`✅ Backed up ${results.length} records from ${table}`);
      } catch (error) {
        this.log(`⚠️  Could not backup ${table}: ${error.message}`);
      }
    }

    await fs.writeFile(this.backupPath, JSON.stringify(backup, null, 2));
    this.log(`💾 Backup saved to ${this.backupPath}`);
  }

  async migrateTenants() {
    this.log('👥 Migrating tenants...');

    const [tenants] = await this.sequelize.query(`
      SELECT id, name, email, phone, screening_status, matching_profile,
             is_active, payment_methods, subscription_id, created_at, updated_at
      FROM tenants
    `);

    let migrated = 0;
    let skipped = 0;

    for (const tenant of tenants) {
      try {
        // Check if tenant already exists in Prisma
        const existing = await this.prisma.tenant.findUnique({
          where: { id: tenant.id }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Transform data for Prisma schema
        const prismaTenant = {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
          screeningStatus: tenant.screening_status || 'pending',
          matchingProfile: tenant.matching_profile || {},
          isActive: tenant.is_active !== false,
          paymentMethods: tenant.payment_methods || [],
          subscriptionId: tenant.subscription_id,
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at
        };

        await this.prisma.tenant.create({ data: prismaTenant });
        migrated++;
      } catch (error) {
        this.log(`❌ Failed to migrate tenant ${tenant.id}: ${error.message}`);
      }
    }

    this.log(`✅ Migrated ${migrated} tenants, skipped ${skipped}`);
    return { migrated, skipped };
  }

  async migrateProperties() {
    this.log('🏠 Migrating properties...');

    const [properties] = await this.sequelize.query(`
      SELECT id, title, description, address, city, state, zip_code,
             rent_amount, property_type, bedrooms, bathrooms, square_feet,
             amenities, images, is_available, landlord_id, created_at, updated_at
      FROM properties
    `);

    let migrated = 0;
    let skipped = 0;

    for (const property of properties) {
      try {
        const existing = await this.prisma.property.findUnique({
          where: { id: property.id }
        });

        if (existing) {
          skipped++;
          continue;
        }

        const prismaProperty = {
          id: property.id,
          title: property.title,
          description: property.description,
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zip_code,
          rentAmount: property.rent_amount,
          propertyType: property.property_type,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFeet: property.square_feet,
          amenities: property.amenities || [],
          images: property.images || [],
          isAvailable: property.is_available !== false,
          landlordId: property.landlord_id,
          createdAt: property.created_at,
          updatedAt: property.updated_at
        };

        await this.prisma.property.create({ data: prismaProperty });
        migrated++;
      } catch (error) {
        this.log(`❌ Failed to migrate property ${property.id}: ${error.message}`);
      }
    }

    this.log(`✅ Migrated ${migrated} properties, skipped ${skipped}`);
    return { migrated, skipped };
  }

  async migrateInvoices() {
    this.log('📄 Migrating invoices...');

    const [invoices] = await this.sequelize.query(`
      SELECT id, tenant_id, amount, status, stripe_price_id,
             subscription_id, due_date, pdf_url, created_at, updated_at
      FROM invoices
    `);

    let migrated = 0;
    let skipped = 0;

    for (const invoice of invoices) {
      try {
        const existing = await this.prisma.invoice.findUnique({
          where: { id: invoice.id }
        });

        if (existing) {
          skipped++;
          continue;
        }

        const prismaInvoice = {
          id: invoice.id,
          tenantId: invoice.tenant_id,
          amount: invoice.amount,
          status: invoice.status || 'pending',
          stripePriceId: invoice.stripe_price_id,
          subscriptionId: invoice.subscription_id,
          dueDate: invoice.due_date,
          pdfUrl: invoice.pdf_url,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at
        };

        await this.prisma.invoice.create({ data: prismaInvoice });
        migrated++;
      } catch (error) {
        this.log(`❌ Failed to migrate invoice ${invoice.id}: ${error.message}`);
      }
    }

    this.log(`✅ Migrated ${migrated} invoices, skipped ${skipped}`);
    return { migrated, skipped };
  }

  async migratePayments() {
    this.log('💳 Migrating payments...');

    const [payments] = await this.sequelize.query(`
      SELECT id, invoice_id, tenant_id, amount, status,
             stripe_charge_id, created_at, updated_at
      FROM payments
    `);

    let migrated = 0;
    let skipped = 0;

    for (const payment of payments) {
      try {
        const existing = await this.prisma.payment.findUnique({
          where: { id: payment.id }
        });

        if (existing) {
          skipped++;
          continue;
        }

        const prismaPayment = {
          id: payment.id,
          invoiceId: payment.invoice_id,
          tenantId: payment.tenant_id,
          amount: payment.amount,
          status: payment.status || 'pending',
          stripeChargeId: payment.stripe_charge_id,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        };

        await this.prisma.payment.create({ data: prismaPayment });
        migrated++;
      } catch (error) {
        this.log(`❌ Failed to migrate payment ${payment.id}: ${error.message}`);
      }
    }

    this.log(`✅ Migrated ${migrated} payments, skipped ${skipped}`);
    return { migrated, skipped };
  }

  async migrateMaintenanceHistory() {
    this.log('🔧 Migrating maintenance history...');

    const [maintenanceRecords] = await this.sequelize.query(`
      SELECT id, property_id, title, description, status, priority,
             scheduled_date, completed_date, cost, contractor_id,
             created_at, updated_at
      FROM maintenance_history
    `);

    let migrated = 0;
    let skipped = 0;

    for (const record of maintenanceRecords) {
      try {
        const existing = await this.prisma.maintenanceHistory.findUnique({
          where: { id: record.id }
        });

        if (existing) {
          skipped++;
          continue;
        }

        const prismaRecord = {
          id: record.id,
          propertyId: record.property_id,
          title: record.title,
          description: record.description,
          status: record.status || 'pending',
          priority: record.priority || 'medium',
          scheduledDate: record.scheduled_date,
          completedDate: record.completed_date,
          cost: record.cost,
          contractorId: record.contractor_id,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        };

        await this.prisma.maintenanceHistory.create({ data: prismaRecord });
        migrated++;
      } catch (error) {
        this.log(`❌ Failed to migrate maintenance record ${record.id}: ${error.message}`);
      }
    }

    this.log(`✅ Migrated ${migrated} maintenance records, skipped ${skipped}`);
    return { migrated, skipped };
  }

  async validateMigration() {
    this.log('🔍 Validating migration...');

    const validation = {
      tenants: { sequelize: 0, prisma: 0 },
      properties: { sequelize: 0, prisma: 0 },
      invoices: { sequelize: 0, prisma: 0 },
      payments: { sequelize: 0, prisma: 0 },
      maintenance: { sequelize: 0, prisma: 0 }
    };

    // Count records in Sequelize
    const [tenantCount] = await this.sequelize.query('SELECT COUNT(*) as count FROM tenants');
    validation.tenants.sequelize = tenantCount[0].count;

    const [propertyCount] = await this.sequelize.query('SELECT COUNT(*) as count FROM properties');
    validation.properties.sequelize = propertyCount[0].count;

    const [invoiceCount] = await this.sequelize.query('SELECT COUNT(*) as count FROM invoices');
    validation.invoices.sequelize = invoiceCount[0].count;

    const [paymentCount] = await this.sequelize.query('SELECT COUNT(*) as count FROM payments');
    validation.payments.sequelize = paymentCount[0].count;

    const [maintenanceCount] = await this.sequelize.query('SELECT COUNT(*) as count FROM maintenance_history');
    validation.maintenance.sequelize = maintenanceCount[0].count;

    // Count records in Prisma
    validation.tenants.prisma = await this.prisma.tenant.count();
    validation.properties.prisma = await this.prisma.property.count();
    validation.invoices.prisma = await this.prisma.invoice.count();
    validation.payments.prisma = await this.prisma.payment.count();
    validation.maintenance.prisma = await this.prisma.maintenanceHistory.count();

    // Report validation results
    this.log('\n📊 Migration Validation Results:');
    this.log('=====================================');

    for (const [table, counts] of Object.entries(validation)) {
      const match = counts.sequelize === counts.prisma;
      const status = match ? '✅' : '❌';
      this.log(`${status} ${table}: Sequelize=${counts.sequelize}, Prisma=${counts.prisma}`);
    }

    return validation;
  }

  async runMigration() {
    console.log('🚀 Starting Sequelize to Prisma Migration...\n');

    try {
      // Initialize connections
      await this.initializeSequelize();
      await this.initializePrisma();

      // Create backup
      await this.createBackup();

      // Run migrations
      const results = {
        tenants: await this.migrateTenants(),
        properties: await this.migrateProperties(),
        invoices: await this.migrateInvoices(),
        payments: await this.migratePayments(),
        maintenance: await this.migrateMaintenanceHistory()
      };

      // Validate migration
      const validation = await this.validateMigration();

      // Generate migration report
      await this.generateMigrationReport(results, validation);

      console.log('\n🎉 Migration completed successfully!');
      console.log('📋 Check migration-report.json for detailed results');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      await this.rollbackMigration();
    } finally {
      await this.prisma.$disconnect();
      if (this.sequelize) {
        await this.sequelize.close();
      }
    }
  }

  async rollbackMigration() {
    this.log('🔄 Rolling back migration...');

    try {
      // Clear migrated data from Prisma
      await this.prisma.payment.deleteMany();
      await this.prisma.invoice.deleteMany();
      await this.prisma.maintenanceHistory.deleteMany();
      await this.prisma.property.deleteMany();
      await this.prisma.tenant.deleteMany();

      this.log('✅ Migration rolled back successfully');
    } catch (error) {
      this.log(`❌ Rollback failed: ${error.message}`);
    }
  }

  async generateMigrationReport(results, validation) {
    const report = {
      timestamp: new Date().toISOString(),
      migration: 'Sequelize to Prisma',
      version: '1.0',
      results,
      validation,
      logs: this.migrationLog
    };

    await fs.writeFile('./migration-report.json', JSON.stringify(report, null, 2));
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new SequelizeToPrismaMigrator();
  migrator.runMigration().catch(console.error);
}

module.exports = SequelizeToPrismaMigrator;