#!/usr/bin/env node

/**
 * Database Backup Script for Sequelize to Prisma Migration
 * Creates comprehensive backups before migration begins
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database-legacy');

class MigrationBackup {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupDir = path.join(__dirname, '..', 'backups', this.timestamp);
    this.logs = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }

  async createBackupDirectory() {
    this.log('Creating backup directory...');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    this.log(`✅ Backup directory created: ${this.backupDir}`);
  }

  async backupDatabaseSchema() {
    this.log('Backing up database schema...');
    try {
      const schemaPath = path.join(this.backupDir, 'schema.sql');

      // Use pg_dump to get schema only
      const command = `pg_dump --schema-only --no-owner --no-privileges --host=${process.env.DB_HOST} --port=${process.env.DB_PORT} --username=${process.env.DB_USER} --dbname=${process.env.DB_NAME} > "${schemaPath}"`;

      execSync(command, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD }
      });

      this.log('✅ Database schema backed up');
      return schemaPath;
    } catch (error) {
      this.log(`❌ Schema backup failed: ${error.message}`);
      throw error;
    }
  }

  async backupDatabaseData() {
    this.log('Backing up database data...');
    try {
      const dataPath = path.join(this.backupDir, 'data.sql');

      // Use pg_dump to get data only
      const command = `pg_dump --data-only --no-owner --no-privileges --host=${process.env.DB_HOST} --port=${process.env.DB_PORT} --username=${process.env.DB_USER} --dbname=${process.env.DB_NAME} > "${dataPath}"`;

      execSync(command, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD }
      });

      this.log('✅ Database data backed up');
      return dataPath;
    } catch (error) {
      this.log(`❌ Data backup failed: ${error.message}`);
      throw error;
    }
  }

  async backupFullDatabase() {
    this.log('Creating full database backup...');
    try {
      const fullPath = path.join(this.backupDir, 'full-backup.sql');

      // Use pg_dump for complete backup
      const command = `pg_dump --no-owner --no-privileges --host=${process.env.DB_HOST} --port=${process.env.DB_PORT} --username=${process.env.DB_USER} --dbname=${process.env.DB_NAME} > "${fullPath}"`;

      execSync(command, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD }
      });

      this.log('✅ Full database backup created');
      return fullPath;
    } catch (error) {
      this.log(`❌ Full backup failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeTableSizes() {
    this.log('Analyzing table sizes...');
    try {
      const [results] = await sequelize.query(`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC;
      `);

      const analysisPath = path.join(this.backupDir, 'table-sizes.json');
      fs.writeFileSync(analysisPath, JSON.stringify(results, null, 2));

      this.log(`✅ Table sizes analyzed (${results.length} tables)`);
      return results;
    } catch (error) {
      this.log(`❌ Table analysis failed: ${error.message}`);
      return [];
    }
  }

  async analyzeRowCounts() {
    this.log('Analyzing row counts...');
    try {
      const [results] = await sequelize.query(`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC;
      `);

      const analysisPath = path.join(this.backupDir, 'row-counts.json');
      fs.writeFileSync(analysisPath, JSON.stringify(results, null, 2));

      this.log(`✅ Row counts analyzed (${results.length} tables)`);
      return results;
    } catch (error) {
      this.log(`❌ Row count analysis failed: ${error.message}`);
      return [];
    }
  }

  async backupPrismaSchema() {
    this.log('Backing up current Prisma schema...');
    try {
      const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
      const backupPath = path.join(this.backupDir, 'prisma-schema.prisma');

      if (fs.existsSync(schemaPath)) {
        fs.copyFileSync(schemaPath, backupPath);
        this.log('✅ Prisma schema backed up');
        return backupPath;
      } else {
        this.log('⚠️  Prisma schema not found');
        return null;
      }
    } catch (error) {
      this.log(`❌ Prisma schema backup failed: ${error.message}`);
      return null;
    }
  }

  async createBackupManifest() {
    this.log('Creating backup manifest...');
    const manifest = {
      timestamp: this.timestamp,
      backupDirectory: this.backupDir,
      database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER
      },
      files: {
        schema: 'schema.sql',
        data: 'data.sql',
        full: 'full-backup.sql',
        prismaSchema: 'prisma-schema.prisma',
        tableSizes: 'table-sizes.json',
        rowCounts: 'row-counts.json'
      },
      logs: this.logs,
      status: 'completed'
    };

    const manifestPath = path.join(this.backupDir, 'backup-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    this.log('✅ Backup manifest created');
    return manifestPath;
  }

  async run() {
    try {
      this.log('🚀 Starting database backup for Sequelize to Prisma migration...');

      // Create backup directory
      await this.createBackupDirectory();

      // Backup database components
      await this.backupDatabaseSchema();
      await this.backupDatabaseData();
      await this.backupFullDatabase();

      // Analyze current state
      await this.analyzeTableSizes();
      await this.analyzeRowCounts();

      // Backup Prisma schema
      await this.backupPrismaSchema();

      // Create manifest
      await this.createBackupManifest();

      this.log('🎉 Database backup completed successfully!');
      this.log(`📁 Backup location: ${this.backupDir}`);

      // Close database connection
      await sequelize.close();

    } catch (error) {
      this.log(`💥 Backup failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  const backup = new MigrationBackup();
  backup.run();
}

module.exports = MigrationBackup;