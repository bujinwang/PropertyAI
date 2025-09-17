/**
 * Notification Model
 * Tracks all notifications sent via email, in-app, SMS, etc.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('email', 'sms', 'push', 'in_app', 'alert'),
    allowNull: false,
    comment: 'Type of notification channel used'
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'User ID of the recipient (for in-app notifications)'
  },
  recipientEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: 'Email address of the recipient (for email notifications)'
  },
  recipientPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Phone number of the recipient (for SMS notifications)'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Subject line for email/SMS notifications'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Full content of the notification'
  },
  status: {
    type: DataTypes.ENUM('queued', 'sent', 'delivered', 'failed', 'bounced'),
    allowNull: false,
    defaultValue: 'queued',
    comment: 'Delivery status of the notification'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal',
    comment: 'Priority level of the notification'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when notification was sent'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when notification was delivered'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when notification was read (for in-app)'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if delivery failed'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of retry attempts'
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: 'Maximum number of retry attempts allowed'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Additional metadata (report IDs, alert IDs, etc.)'
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Tags for categorization and filtering'
  },
  source: {
    type: DataTypes.ENUM('system', 'user', 'scheduled', 'alert', 'report'),
    allowNull: false,
    defaultValue: 'system',
    comment: 'Source that triggered the notification'
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID of the template used to generate this notification'
  },
  cost: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    comment: 'Cost incurred for sending this notification (for billing/analytics)'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string for tracking delivery context'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP address of the recipient when notification was accessed'
  }
}, {
  tableName: 'notifications',
  indexes: [
    {
      fields: ['type', 'status']
    },
    {
      fields: ['recipientId']
    },
    {
      fields: ['recipientEmail']
    },
    {
      fields: ['sentAt']
    },
    {
      fields: ['status', 'sentAt']
    },
    {
      fields: ['source']
    },
    {
      fields: ['priority', 'status']
    },
    {
      fields: ['tags'],
      using: 'gin'
    },
    {
      fields: ['metadata'],
      using: 'gin'
    }
  ],
  hooks: {
    beforeCreate: (notification) => {
      // Set sent timestamp when status changes to sent
      if (notification.status === 'sent' && !notification.sentAt) {
        notification.sentAt = new Date();
      }
    },
    beforeUpdate: (notification) => {
      // Update sent timestamp when status changes to sent
      if (notification.changed('status') && notification.status === 'sent' && !notification.sentAt) {
        notification.sentAt = new Date();
      }

      // Update delivered timestamp when status changes to delivered
      if (notification.changed('status') && notification.status === 'delivered' && !notification.deliveredAt) {
        notification.deliveredAt = new Date();
      }
    }
  }
});

// Instance methods
Notification.prototype.markAsRead = function() {
  this.readAt = new Date();
  return this.save();
};

Notification.prototype.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

Notification.prototype.recordFailure = function(errorMessage) {
  this.status = 'failed';
  this.error = errorMessage;
  this.retryCount += 1;
  return this.save();
};

Notification.prototype.canRetry = function() {
  return this.retryCount < this.maxRetries && this.status === 'failed';
};

Notification.prototype.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
};

Notification.prototype.removeTag = function(tag) {
  const index = this.tags.indexOf(tag);
  if (index > -1) {
    this.tags.splice(index, 1);
  }
};

Notification.prototype.updateMetadata = function(key, value) {
  this.metadata = { ...this.metadata, [key]: value };
  return this.save();
};

Notification.prototype.getDeliveryTime = function() {
  if (this.sentAt && this.deliveredAt) {
    return this.deliveredAt.getTime() - this.sentAt.getTime();
  }
  return null;
};

Notification.prototype.isExpired = function(maxAgeHours = 24) {
  if (!this.sentAt) return false;
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  return (Date.now() - this.sentAt.getTime()) > maxAge;
};

// Class methods
Notification.findByRecipient = function(recipientId, options = {}) {
  const { limit = 50, offset = 0, status, type } = options;
  const whereClause = { recipientId };

  if (status) whereClause.status = status;
  if (type) whereClause.type = type;

  return this.findAll({
    where: whereClause,
    limit,
    offset,
    order: [['sentAt', 'DESC']]
  });
};

Notification.findUnreadByRecipient = function(recipientId) {
  return this.findAll({
    where: {
      recipientId,
      readAt: null,
      type: 'in_app'
    },
    order: [['sentAt', 'DESC']]
  });
};

Notification.getDeliveryStats = function(timeRange = {}) {
  const whereClause = {};
  if (timeRange.start) {
    whereClause.sentAt = {
      [require('sequelize').Op.gte]: timeRange.start
    };
  }
  if (timeRange.end) {
    whereClause.sentAt = {
      ...whereClause.sentAt,
      [require('sequelize').Op.lte]: timeRange.end
    };
  }

  return this.findAll({
    where: whereClause,
    attributes: [
      'type',
      'status',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('AVG',
        require('sequelize').literal('EXTRACT(EPOCH FROM (delivered_at - sent_at))')
      ), 'avg_delivery_time']
    ],
    group: ['type', 'status']
  });
};

Notification.cleanupOldNotifications = function(retentionDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  return this.destroy({
    where: {
      sentAt: {
        [require('sequelize').Op.lt]: cutoffDate
      },
      status: {
        [require('sequelize').Op.in]: ['delivered', 'failed']
      }
    }
  });
};

Notification.retryFailedNotifications = function() {
  return this.update(
    { status: 'queued', retryCount: 0 },
    {
      where: {
        status: 'failed',
        retryCount: {
          [require('sequelize').Op.lt]: require('sequelize').col('maxRetries')
        }
      }
    }
  );
};

module.exports = Notification;