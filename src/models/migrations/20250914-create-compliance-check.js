'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ComplianceChecks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      reportId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'GeneratedReports',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      templateId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'ReportTemplates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      checkType: {
        type: Sequelize.ENUM(
          'gdpr', 'sox', 'hipaa', 'ccpa', 'data_retention',
          'pii_detection', 'sensitive_data', 'export_controls',
          'audit_trail', 'data_accuracy', 'consent_tracking'
        ),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'running', 'passed', 'failed', 'exempted'),
        allowNull: false,
        defaultValue: 'pending'
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      findings: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      violations: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      recommendations: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      dataClassification: {
        type: Sequelize.ENUM('public', 'internal', 'confidential', 'restricted'),
        allowNull: false,
        defaultValue: 'internal'
      },
      jurisdictions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      exempted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      exemptionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approvedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextReviewDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      initiatedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processingTime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('ComplianceChecks', ['reportId']);
    await queryInterface.addIndex('ComplianceChecks', ['templateId']);
    await queryInterface.addIndex('ComplianceChecks', ['checkType']);
    await queryInterface.addIndex('ComplianceChecks', ['status']);
    await queryInterface.addIndex('ComplianceChecks', ['severity']);
    await queryInterface.addIndex('ComplianceChecks', ['dataClassification']);
    await queryInterface.addIndex('ComplianceChecks', ['nextReviewDate']);
    await queryInterface.addIndex('ComplianceChecks', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ComplianceChecks');
  }
};