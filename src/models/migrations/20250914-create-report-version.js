'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ReportVersions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      reportId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'GeneratedReports',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      content: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      contentHash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      changes: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      changeType: {
        type: Sequelize.ENUM(
          'initial', 'regenerated', 'manual_edit', 'data_refresh',
          'template_update', 'compliance_fix', 'error_correction'
        ),
        allowNull: false,
        defaultValue: 'initial'
      },
      changeReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      aiConfidence: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true
      },
      dataSources: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      complianceStatus: {
        type: Sequelize.ENUM('pending', 'passed', 'failed', 'exempted'),
        allowNull: false,
        defaultValue: 'pending'
      },
      complianceIssues: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('ReportVersions', ['reportId']);
    await queryInterface.addIndex('ReportVersions', ['reportId', 'version'], {
      unique: true
    });
    await queryInterface.addIndex('ReportVersions', ['createdBy']);
    await queryInterface.addIndex('ReportVersions', ['complianceStatus']);
    await queryInterface.addIndex('ReportVersions', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ReportVersions');
  }
};