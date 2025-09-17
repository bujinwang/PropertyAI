'use strict';

/**
 * Migration: Create Feedback Table for Epic 21 User Feedback Collection
 * Advanced Analytics and AI Insights Features
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedback', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      // User information
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      userType: {
        type: Sequelize.ENUM('property_manager', 'maintenance_staff', 'leasing_agent', 'investor', 'executive', 'other'),
        allowNull: false
      },

      // Feedback context
      feature: {
        type: Sequelize.ENUM(
          'predictive_maintenance',
          'tenant_churn_prediction',
          'market_trend_integration',
          'ai_powered_reporting',
          'risk_assessment_dashboard',
          'overall_experience'
        ),
        allowNull: false
      },

      feedbackType: {
        type: Sequelize.ENUM('bug_report', 'feature_request', 'usability_feedback', 'performance_feedback', 'general_feedback'),
        allowNull: false
      },

      // Feedback content
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },

      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      // Categorization
      category: {
        type: Sequelize.ENUM(
          'accuracy',
          'usability',
          'performance',
          'functionality',
          'design',
          'integration',
          'data_quality',
          'other'
        ),
        allowNull: false
      },

      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        allowNull: false
      },

      // Status tracking
      status: {
        type: Sequelize.ENUM('new', 'acknowledged', 'in_review', 'addressed', 'closed'),
        defaultValue: 'new',
        allowNull: false
      },

      // Metadata
      userAgent: {
        type: Sequelize.STRING(500),
        allowNull: true
      },

      url: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },

      sessionId: {
        type: Sequelize.UUID,
        allowNull: true
      },

      // Timestamps
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      acknowledgedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },

      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('feedback', ['userId']);
    await queryInterface.addIndex('feedback', ['feature']);
    await queryInterface.addIndex('feedback', ['feedbackType']);
    await queryInterface.addIndex('feedback', ['category']);
    await queryInterface.addIndex('feedback', ['status']);
    await queryInterface.addIndex('feedback', ['priority']);
    await queryInterface.addIndex('feedback', ['createdAt']);
    await queryInterface.addIndex('feedback', ['rating']);
    await queryInterface.addIndex('feedback', ['userId', 'feature']);
    await queryInterface.addIndex('feedback', ['createdAt', 'feature']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('feedback');
  }
};