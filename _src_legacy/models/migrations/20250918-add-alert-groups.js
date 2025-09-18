'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create AlertGroups table
    await queryInterface.createTable('AlertGroups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      groupType: {
        type: Sequelize.ENUM('maintenance', 'churn', 'market'),
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Properties',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      alertCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add unique index for grouping
    await queryInterface.addIndex('AlertGroups', ['groupType', 'priority', 'propertyId'], {
      unique: true,
    });

    // Add groupId to Alert table
    await queryInterface.addColumn('Alerts', 'groupId', {
      type: Sequelize.UUID,
      references: {
        model: 'AlertGroups',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
    });

    // Add indexes for Alert
    await queryInterface.addIndex('Alerts', ['groupId']);
    await queryInterface.addIndex('Alerts', ['type', 'priority', 'propertyId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop FK and column
    await queryInterface.removeColumn('Alerts', 'groupId');

    // Drop indexes on Alert
    await queryInterface.removeIndex('Alerts', ['type', 'priority', 'propertyId']);
    await queryInterface.removeIndex('Alerts', ['groupId']);

    // Drop AlertGroups table
    await queryInterface.dropTable('AlertGroups');
  },
};