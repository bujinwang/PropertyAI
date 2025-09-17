'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ReportAuditLogs', {
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
      action: {
        type: Sequelize.ENUM(
          'created', 'viewed', 'exported', 'emailed', 'scheduled',
          'modified', 'deleted', 'shared', 'accessed', 'compliance_check'
        ),
        allowNull: false
      },
      resourceType: {
        type: Sequelize.ENUM('report', 'template', 'schedule', 'export'),
        allowNull: false
      },
      resourceId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      complianceFlags: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      riskLevel: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: true
      },
      aiConfidence: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true
      },
      processingTime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      dataSensitivity: {
        type: Sequelize.ENUM('public', 'internal', 'confidential', 'restricted'),
        allowNull: true,
        defaultValue: 'internal'
      },
      retentionDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('ReportAuditLogs', ['userId']);
    await queryInterface.addIndex('ReportAuditLogs', ['reportId']);
    await queryInterface.addIndex('ReportAuditLogs', ['templateId']);
    await queryInterface.addIndex('ReportAuditLogs', ['action']);
    await queryInterface.addIndex('ReportAuditLogs', ['resourceType', 'resourceId']);
    await queryInterface.addIndex('ReportAuditLogs', ['createdAt']);
    await queryInterface.addIndex('ReportAuditLogs', ['dataSensitivity']);
    await queryInterface.addIndex('ReportAuditLogs', ['retentionDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ReportAuditLogs');
  }
};