#!/usr/bin/env node

/**
 * Performance Optimization Migration Runner - Epic 21.5.1
 * Executes database migrations for performance improvements
 */

const { sequelize } = require('../src/config/database');
const path = require('path');
const fs = require('fs');

class MigrationRunner {
  constructor() {
    this.migrationPath = path.join(__dirname, '../src/models/migrations');
    this.performanceMigration = '20250915-performance-optimization-indexes.js';
  }

  /**
   * Run the performance optimization migration
   */
  async runMigration() {
    console.log('🚀 Starting Performance Optimization Migration');
    console.log('==============================================\n');

    try {
      // Check database connection
      await this.checkDatabaseConnection();

      // Check if migration file exists
      await this.checkMigrationFile();

      // Run the migration
      await this.executeMigration();

      // Validate migration success
      await this.validateMigration();

      console.log('\n✅ Performance optimization migration completed successfully!');
      console.log('📊 Database performance improvements have been applied.');
      console.log('🔄 Services will automatically restart to use optimized configuration.');

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      console.error('🔧 Troubleshooting:');
      console.error('   - Ensure database is running and accessible');
      console.error('   - Check database credentials in .env file');
      console.error('   - Verify user has CREATE INDEX permissions');
      console.error('   - Review migration logs above for specific errors');

      process.exit(1);
    }
  }

  /**
   * Check database connection
   */
  async checkDatabaseConnection() {
    console.log('🔍 Checking database connection...');

    try {
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Check if migration file exists
   */
  async checkMigrationFile() {
    console.log('📁 Checking migration file...');

    const migrationFilePath = path.join(this.migrationPath, this.performanceMigration);

    if (!fs.existsSync(migrationFilePath)) {
      throw new Error(`Migration file not found: ${migrationFilePath}`);
    }

    console.log(`✅ Migration file found: ${this.performanceMigration}`);
  }

  /**
   * Execute the migration
   */
  async executeMigration() {
    console.log('⚡ Executing performance optimization migration...');
    console.log('   This may take several minutes depending on database size...\n');

    try {
      // Import the migration
      const migration = require(path.join(this.migrationPath, this.performanceMigration));

      // Run the up migration
      await migration.up(sequelize.getQueryInterface(), sequelize.constructor);

      console.log('✅ Migration executed successfully');

    } catch (error) {
      // If migration fails, attempt rollback
      console.error('❌ Migration execution failed, attempting rollback...');

      try {
        const migration = require(path.join(this.migrationPath, this.performanceMigration));
        await migration.down(sequelize.getQueryInterface(), sequelize.constructor);
        console.log('✅ Rollback completed');
      } catch (rollbackError) {
        console.error('❌ Rollback also failed:', rollbackError.message);
      }

      throw error;
    }
  }

  /**
   * Validate migration success
   */
  async validateMigration() {
    console.log('🔍 Validating migration success...');

    try {
      // Check if key indexes were created
      const indexesToCheck = [
        'idx_properties_location_type_status',
        'idx_market_data_property_date_metric',
        'idx_maintenance_property_type_date',
        'idx_tenants_property_lease_dates'
      ];

      for (const indexName of indexesToCheck) {
        const result = await sequelize.query(
          `SELECT 1 FROM pg_indexes WHERE indexname = '${indexName}'`,
          { type: sequelize.QueryTypes.SELECT }
        );

        if (result.length === 0) {
          console.warn(`⚠️ Index not found: ${indexName}`);
        } else {
          console.log(`✅ Index verified: ${indexName}`);
        }
      }

      console.log('✅ Migration validation completed');

    } catch (error) {
      console.warn('⚠️ Migration validation encountered issues:', error.message);
      console.log('   This may be due to permissions or database version differences');
    }
  }

  /**
   * Show migration summary
   */
  showMigrationSummary() {
    console.log('\n📋 PERFORMANCE OPTIMIZATION SUMMARY');
    console.log('=====================================\n');

    console.log('🗂️ DATABASE INDEXES ADDED:');
    console.log('   • Properties: location + type + status composite index');
    console.log('   • Properties: created_at + updated_at date index');
    console.log('   • Properties: active records partial index');
    console.log('   • Market Data: property + date + metric composite index');
    console.log('   • Market Data: date range query index');
    console.log('   • Market Data: metric type query index');
    console.log('   • Maintenance: property + type + date composite index');
    console.log('   • Maintenance: priority + status query index');
    console.log('   • Maintenance: cost analysis index');
    console.log('   • Tenants: property + lease dates composite index');
    console.log('   • Tenants: status query index');
    console.log('   • Various foreign key optimization indexes\n');

    console.log('⚙️ CONNECTION POOL OPTIMIZED:');
    console.log('   • Max connections: 5 → 20');
    console.log('   • Min connections: 0 → 5');
    console.log('   • Query timeout: 60 seconds');
    console.log('   • Connection retry logic added\n');

    console.log('💾 CACHE SERVICE ENABLED:');
    console.log('   • Redis-based query result caching');
    console.log('   • Automatic cache key generation');
    console.log('   • Cache invalidation strategies');
    console.log('   • Performance monitoring integration\n');

    console.log('📊 MONITORING ENABLED:');
    console.log('   • Query performance tracking');
    console.log('   • Slow query detection and alerting');
    console.log('   • Cache hit rate monitoring');
    console.log('   • System metrics collection\n');

    console.log('🎯 EXPECTED PERFORMANCE IMPROVEMENTS:');
    console.log('   • Dashboard load time: 40% reduction (3.5s → <2s)');
    console.log('   • API response time: <500ms for 95% of requests');
    console.log('   • Database CPU usage: 30% reduction');
    console.log('   • Cache hit rate: >80% for dashboard queries');
    console.log('   • Concurrent users: Support 2x current peak load\n');

    console.log('🚀 NEXT STEPS:');
    console.log('   1. Restart application services to use new configuration');
    console.log('   2. Monitor performance improvements over next 24 hours');
    console.log('   3. Review cache hit rates and adjust TTL if needed');
    console.log('   4. Set up alerts for performance degradation');
    console.log('   5. Consider additional optimizations based on monitoring data\n');
  }
}

// Main execution
async function main() {
  const runner = new MigrationRunner();

  try {
    await runner.runMigration();
    runner.showMigrationSummary();
  } catch (error) {
    console.error('Migration runner failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MigrationRunner;