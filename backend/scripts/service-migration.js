#!/usr/bin/env node

/**
 * Service Migration Script: Sequelize to Prisma
 * Systematically migrates services from Sequelize to Prisma
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ServiceMigration {
  constructor() {
    this.servicesDir = path.join(__dirname, '..', 'src', 'services');
    this.migrationLog = [];
    this.backupDir = path.join(__dirname, '..', 'backups', 'services');
  }

  log(message, service = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${service ? `[${service}] ` : ''}${message}`;
    console.log(logMessage);
    this.migrationLog.push(logMessage);
  }

  async createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    this.log('Service backup directory created');
  }

  async backupService(serviceName) {
    const servicePath = path.join(this.servicesDir, serviceName);
    const backupPath = path.join(this.backupDir, `${serviceName}.backup`);

    if (fs.existsSync(servicePath)) {
      fs.copyFileSync(servicePath, backupPath);
      this.log(`Service backed up: ${serviceName}`, serviceName);
      return backupPath;
    } else {
      this.log(`Service not found: ${serviceName}`, serviceName);
      return null;
    }
  }

  async analyzeService(serviceName) {
    const servicePath = path.join(this.servicesDir, serviceName);

    if (!fs.existsSync(servicePath)) {
      return { exists: false, sequelizeUsage: [], prismaReady: false };
    }

    const content = fs.readFileSync(servicePath, 'utf8');

    // Analyze Sequelize usage patterns
    const sequelizePatterns = [
      /const.*=.*require.*models.*Property/g,
      /const.*=.*require.*models.*\w+/g,
      /\.findByPk\(/g,
      /\.findAll\(/g,
      /\.create\(/g,
      /\.update\(/g,
      /\.destroy\(/g,
      /sequelize\./g,
      /transaction\./g
    ];

    const sequelizeUsage = [];
    sequelizePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        sequelizeUsage.push(...matches);
      }
    });

    // Check if already using Prisma
    const prismaUsage = content.match(/@prisma\/client/g) || content.match(/new PrismaClient/g);

    return {
      exists: true,
      sequelizeUsage: [...new Set(sequelizeUsage)], // Remove duplicates
      prismaReady: !!prismaUsage,
      lines: content.split('\n').length
    };
  }

  generatePrismaEquivalent(sequelizeCode) {
    // Convert common Sequelize patterns to Prisma
    const conversions = {
      '.findByPk(': '.findUnique({ where: { id:',
      '.findAll(': '.findMany(',
      '.create(': '.create({ data:',
      '.update(': '.update({ where:',
      '.destroy(': '.delete({ where:',
    };

    let prismaCode = sequelizeCode;

    // Handle findByPk with ID parameter
    prismaCode = prismaCode.replace(/\.findByPk\((\w+)\)/g, '.findUnique({ where: { id: $1 } })');

    // Handle other patterns
    Object.entries(conversions).forEach(([sequelize, prisma]) => {
      prismaCode = prismaCode.replace(new RegExp(sequelize.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), prisma);
    });

    return prismaCode;
  }

  async migrateService(serviceName) {
    this.log(`Starting migration of ${serviceName}`, serviceName);

    // Backup the service
    await this.backupService(serviceName);

    // Analyze current service
    const analysis = await this.analyzeService(serviceName);
    if (!analysis.exists) {
      this.log(`Service ${serviceName} does not exist`, serviceName);
      return false;
    }

    if (analysis.prismaReady) {
      this.log(`Service ${serviceName} already uses Prisma`, serviceName);
      return true;
    }

    this.log(`Found ${analysis.sequelizeUsage.length} Sequelize patterns to migrate`, serviceName);

    // Read and migrate the service
    const servicePath = path.join(this.servicesDir, serviceName);
    let content = fs.readFileSync(servicePath, 'utf8');

    // Add Prisma import if not present
    if (!content.includes('@prisma/client')) {
      const importStatement = "const { PrismaClient } = require('@prisma/client');\nconst prisma = new PrismaClient();\n";
      // Insert after existing imports
      const firstRequireMatch = content.match(/const.*require.*;/);
      if (firstRequireMatch) {
        const insertIndex = content.indexOf(firstRequireMatch[0]) + firstRequireMatch[0].length;
        content = content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
      } else {
        content = importStatement + content;
      }
    }

    // Convert Sequelize model imports to Prisma
    content = content.replace(/const (\w+) = require\(['"].*models\/(\w+)['"]\);/g,
      'const { $2: $1Model } = prisma;');

    // Convert common Sequelize patterns
    content = content.replace(/\.findByPk\((\w+)\)/g, '.findUnique({ where: { id: $1 } })');
    content = content.replace(/\.findAll\(\{/g, '.findMany({');
    content = content.replace(/\.create\(\{/g, '.create({ data: {');
    content = content.replace(/\.update\(\{/g, '.update({ where: {');
    content = content.replace(/\.destroy\(\{/g, '.delete({ where: {');

    // Write the migrated service
    fs.writeFileSync(servicePath, content);

    this.log(`Migration completed for ${serviceName}`, serviceName);
    this.log(`Converted ${analysis.sequelizeUsage.length} Sequelize patterns`, serviceName);

    return true;
  }

  async testService(serviceName) {
    this.log(`Testing migrated service: ${serviceName}`, serviceName);

    try {
      // Basic syntax check
      const servicePath = path.join(this.servicesDir, serviceName);
      const content = fs.readFileSync(servicePath, 'utf8');

      // Check for common migration issues
      const issues = [];

      if (content.includes('require(\'../models/')) {
        issues.push('Still has Sequelize model imports');
      }

      if (content.includes('.findByPk(') && !content.includes('.findUnique(')) {
        issues.push('Unconverted findByPk calls');
      }

      if (content.includes('sequelize.') && !content.includes('prisma.')) {
        issues.push('Unconverted sequelize references');
      }

      if (issues.length > 0) {
        this.log(`Issues found: ${issues.join(', ')}`, serviceName);
        return false;
      }

      this.log(`Service ${serviceName} passed basic validation`, serviceName);
      return true;

    } catch (error) {
      this.log(`Test failed for ${serviceName}: ${error.message}`, serviceName);
      return false;
    }
  }

  async runMigration(services = []) {
    this.log('🚀 Starting service migration from Sequelize to Prisma...');

    await this.createBackupDirectory();

    const results = {
      total: services.length,
      migrated: 0,
      failed: 0,
      skipped: 0
    };

    for (const serviceName of services) {
      try {
        this.log(`Processing ${serviceName}...`, serviceName);

        const migrated = await this.migrateService(serviceName);
        if (migrated) {
          const tested = await this.testService(serviceName);
          if (tested) {
            results.migrated++;
            this.log(`✅ Successfully migrated ${serviceName}`, serviceName);
          } else {
            results.failed++;
            this.log(`❌ Migration validation failed for ${serviceName}`, serviceName);
          }
        } else {
          results.skipped++;
          this.log(`⏭️  Skipped ${serviceName}`, serviceName);
        }

      } catch (error) {
        results.failed++;
        this.log(`💥 Migration failed for ${serviceName}: ${error.message}`, serviceName);
      }
    }

    // Save migration log
    const logPath = path.join(this.backupDir, 'migration-log.json');
    fs.writeFileSync(logPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      log: this.migrationLog
    }, null, 2));

    this.log(`\n📊 Migration Summary:`);
    this.log(`Total services: ${results.total}`);
    this.log(`Successfully migrated: ${results.migrated}`);
    this.log(`Failed: ${results.failed}`);
    this.log(`Skipped: ${results.skipped}`);
    this.log(`\n📁 Migration log saved to: ${logPath}`);

    return results;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const services = args.length > 0 ? args : [
    'marketDataService.js',
    'analyticsService.js',
    'riskAssessmentService.js'
  ];

  const migration = new ServiceMigration();
  migration.runMigration(services).then(() => {
    console.log('\n🎉 Service migration completed!');
  }).catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

module.exports = ServiceMigration;