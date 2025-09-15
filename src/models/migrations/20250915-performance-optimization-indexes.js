'use strict';

/**
 * Performance Optimization Migration - Epic 21.5.1
 * Adds comprehensive indexes for improved query performance
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Starting performance optimization migration...');

    // Task 2: Index Optimization - High Priority Indexes
    console.log('Creating high-priority indexes...');

    // Properties table - Most critical for dashboard queries
    try {
      // Composite index for location-based property queries
      await queryInterface.addIndex('properties', ['location', 'property_type', 'status'], {
        name: 'idx_properties_location_type_status',
        concurrently: true, // Allow concurrent index creation
      });

      // Index for date-based property queries
      await queryInterface.addIndex('properties', ['created_at', 'updated_at'], {
        name: 'idx_properties_dates',
        concurrently: true,
      });

      // Partial index for active properties only
      await queryInterface.addIndex('properties', ['id'], {
        name: 'idx_properties_active_only',
        where: { status: 'active' },
        concurrently: true,
      });

      console.log('Properties indexes created successfully');
    } catch (error) {
      console.error('Error creating properties indexes:', error);
    }

    // Market data table - Critical for market trend queries
    try {
      // Composite index for property-market data queries
      await queryInterface.addIndex('market_data', ['property_id', 'date', 'metric_type'], {
        name: 'idx_market_data_property_date_metric',
        concurrently: true,
      });

      // Index for date range queries
      await queryInterface.addIndex('market_data', ['date'], {
        name: 'idx_market_data_date',
        concurrently: true,
      });

      // Index for metric type queries
      await queryInterface.addIndex('market_data', ['metric_type'], {
        name: 'idx_market_data_metric_type',
        concurrently: true,
      });

      console.log('Market data indexes created successfully');
    } catch (error) {
      console.error('Error creating market data indexes:', error);
    }

    // Maintenance history - Already has some indexes, adding more
    try {
      // Composite index for predictive maintenance queries
      await queryInterface.addIndex('maintenance_history', ['property_id', 'type', 'date'], {
        name: 'idx_maintenance_property_type_date',
        concurrently: true,
      });

      // Index for priority-based queries
      await queryInterface.addIndex('maintenance_history', ['priority', 'status'], {
        name: 'idx_maintenance_priority_status',
        concurrently: true,
      });

      // Index for cost analysis queries
      await queryInterface.addIndex('maintenance_history', ['cost'], {
        name: 'idx_maintenance_cost',
        concurrently: true,
      });

      console.log('Maintenance history indexes created successfully');
    } catch (error) {
      console.error('Error creating maintenance history indexes:', error);
    }

    // Tenant data table
    try {
      // Composite index for tenant search queries
      await queryInterface.addIndex('tenants', ['property_id', 'lease_start_date', 'lease_end_date'], {
        name: 'idx_tenants_property_lease_dates',
        concurrently: true,
      });

      // Index for tenant status queries
      await queryInterface.addIndex('tenants', ['status'], {
        name: 'idx_tenants_status',
        concurrently: true,
      });

      console.log('Tenant indexes created successfully');
    } catch (error) {
      console.error('Error creating tenant indexes:', error);
    }

    // Task 2: Medium Priority Indexes
    console.log('Creating medium-priority indexes...');

    try {
      // Dashboard query optimization indexes
      await queryInterface.addIndex('properties', ['owner_id', 'status'], {
        name: 'idx_properties_owner_status',
        concurrently: true,
      });

      // Analytics query indexes
      await queryInterface.addIndex('market_data', ['property_id', 'metric_type'], {
        name: 'idx_market_data_property_metric',
        concurrently: true,
      });

      // Foreign key optimization indexes
      await queryInterface.addIndex('maintenance_history', ['property_id'], {
        name: 'idx_maintenance_property_fk',
        concurrently: true,
      });

      console.log('Medium-priority indexes created successfully');
    } catch (error) {
      console.error('Error creating medium-priority indexes:', error);
    }

    // Task 3: Query Optimization - Add any missing foreign key constraints
    console.log('Validating foreign key constraints...');

    try {
      // Ensure foreign key constraints exist and are properly indexed
      const foreignKeys = await queryInterface.showConstraint('maintenance_history');

      // Add any missing foreign key indexes
      const hasPropertyFkIndex = foreignKeys.some(fk =>
        fk.constraintName && fk.constraintName.includes('property_id')
      );

      if (!hasPropertyFkIndex) {
        await queryInterface.addIndex('maintenance_history', ['property_id'], {
          name: 'fk_maintenance_property_id',
          concurrently: true,
        });
      }

      console.log('Foreign key constraints validated');
    } catch (error) {
      console.error('Error validating foreign key constraints:', error);
    }

    console.log('Performance optimization migration completed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Rolling back performance optimization indexes...');

    // Remove indexes in reverse order
    try {
      // High-priority indexes
      await queryInterface.removeIndex('properties', 'idx_properties_location_type_status');
      await queryInterface.removeIndex('properties', 'idx_properties_dates');
      await queryInterface.removeIndex('properties', 'idx_properties_active_only');

      await queryInterface.removeIndex('market_data', 'idx_market_data_property_date_metric');
      await queryInterface.removeIndex('market_data', 'idx_market_data_date');
      await queryInterface.removeIndex('market_data', 'idx_market_data_metric_type');

      await queryInterface.removeIndex('maintenance_history', 'idx_maintenance_property_type_date');
      await queryInterface.removeIndex('maintenance_history', 'idx_maintenance_priority_status');
      await queryInterface.removeIndex('maintenance_history', 'idx_maintenance_cost');

      await queryInterface.removeIndex('tenants', 'idx_tenants_property_lease_dates');
      await queryInterface.removeIndex('tenants', 'idx_tenants_status');

      // Medium-priority indexes
      await queryInterface.removeIndex('properties', 'idx_properties_owner_status');
      await queryInterface.removeIndex('market_data', 'idx_market_data_property_metric');
      await queryInterface.removeIndex('maintenance_history', 'idx_maintenance_property_fk');

      // Foreign key indexes
      await queryInterface.removeIndex('maintenance_history', 'fk_maintenance_property_id');

      console.log('All performance optimization indexes removed');
    } catch (error) {
      console.error('Error during rollback:', error);
      throw error;
    }
  },
};