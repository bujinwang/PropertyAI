'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserTemplates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      templateName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      layout: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isShared: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      sharedWith: {
        type: Sequelize.JSON,
        defaultValue: [],
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

    await queryInterface.addIndex('UserTemplates', ['userId', 'templateName'], {
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserTemplates');
  },
};