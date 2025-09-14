'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('report_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100]
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('monthly', 'quarterly', 'weekly', 'daily', 'custom'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      category: {
        type: Sequelize.ENUM('executive', 'operational', 'financial', 'compliance', 'custom'),
        allowNull: false,
        defaultValue: 'executive'
      },
      sections: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      dataSources: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      visualizations: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      filters: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      styling: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          theme: 'default',
          colors: {
            primary: '#1976d2',
            secondary: '#dc004e',
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336'
          },
          fonts: {
            primary: 'Roboto',
            secondary: 'Open Sans'
          }
        }
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
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
    await queryInterface.addIndex('report_templates', ['type', 'category']);
    await queryInterface.addIndex('report_templates', ['createdBy']);
    await queryInterface.addIndex('report_templates', ['isActive', 'isPublic']);
    await queryInterface.addIndex('report_templates', ['tags'], {
      using: 'gin'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('report_templates');
  }
};