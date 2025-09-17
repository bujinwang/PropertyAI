'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('email', 'sms', 'push', 'in_app', 'alert'),
        allowNull: false
      },
      recipientId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      recipientEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      recipientPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('queued', 'sent', 'delivered', 'failed', 'bounced'),
        allowNull: false,
        defaultValue: 'queued'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal'
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retryCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      source: {
        type: Sequelize.ENUM('system', 'user', 'scheduled', 'alert', 'report'),
        allowNull: false,
        defaultValue: 'system'
      },
      templateId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cost: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.addIndex('notifications', ['type', 'status']);
    await queryInterface.addIndex('notifications', ['recipientId']);
    await queryInterface.addIndex('notifications', ['recipientEmail']);
    await queryInterface.addIndex('notifications', ['sentAt']);
    await queryInterface.addIndex('notifications', ['status', 'sentAt']);
    await queryInterface.addIndex('notifications', ['source']);
    await queryInterface.addIndex('notifications', ['priority', 'status']);
    await queryInterface.addIndex('notifications', ['tags'], {
      using: 'gin'
    });
    await queryInterface.addIndex('notifications', ['metadata'], {
      using: 'gin'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};