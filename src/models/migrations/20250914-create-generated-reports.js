'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('generated_reports', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      templateId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      templateName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      generatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      parameters: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      insights: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      recommendations: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('generating', 'completed', 'failed', 'expired'),
        allowNull: false,
        defaultValue: 'generating'
      },
      format: {
        type: Sequelize.ENUM('json', 'pdf', 'csv', 'excel'),
        allowNull: false,
        defaultValue: 'json'
      },
      fileSize: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      downloadCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastAccessedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      accessToken: {
        type: Sequelize.UUID,
        allowNull: true
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
      recipientEmails: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      processingTime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      auditTrail: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('generated_reports', ['templateId']);
    await queryInterface.addIndex('generated_reports', ['createdBy']);
    await queryInterface.addIndex('generated_reports', ['status']);
    await queryInterface.addIndex('generated_reports', ['generatedAt']);
    await queryInterface.addIndex('generated_reports', ['expiresAt']);
    await queryInterface.addIndex('generated_reports', ['isPublic']);
    await queryInterface.addIndex('generated_reports', ['tags'], {
      using: 'gin'
    });
    await queryInterface.addIndex('generated_reports', ['recipientEmails'], {
      using: 'gin'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('generated_reports');
  }
};