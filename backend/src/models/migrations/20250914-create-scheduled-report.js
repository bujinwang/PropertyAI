'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScheduledReports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      templateId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ReportTemplates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      frequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'quarterly'),
        allowNull: false
      },
      dayOfWeek: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 6
        }
      },
      dayOfMonth: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 31
        }
      },
      time: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '09:00:00'
      },
      recipients: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      format: {
        type: Sequelize.ENUM('pdf', 'csv', 'excel', 'html'),
        allowNull: false,
        defaultValue: 'pdf'
      },
      parameters: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastRunAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextRunAt: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('ScheduledReports', ['userId']);
    await queryInterface.addIndex('ScheduledReports', ['templateId']);
    await queryInterface.addIndex('ScheduledReports', ['nextRunAt']);
    await queryInterface.addIndex('ScheduledReports', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ScheduledReports');
  }
};