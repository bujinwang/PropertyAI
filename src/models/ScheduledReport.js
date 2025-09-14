const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduledReport = sequelize.define('ScheduledReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ReportTemplates',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly'),
    allowNull: false
  },
  dayOfWeek: {
    type: DataTypes.INTEGER, // 0-6 for Sunday-Saturday
    allowNull: true
  },
  dayOfMonth: {
    type: DataTypes.INTEGER, // 1-31
    allowNull: true
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '09:00:00' // 9 AM default
  },
  recipients: {
    type: DataTypes.JSONB, // Array of email addresses
    allowNull: false,
    defaultValue: []
  },
  format: {
    type: DataTypes.ENUM('pdf', 'csv', 'excel', 'html'),
    allowNull: false,
    defaultValue: 'pdf'
  },
  parameters: {
    type: DataTypes.JSONB, // Report parameters to use
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastRunAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextRunAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'ScheduledReports',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['templateId']
    },
    {
      fields: ['nextRunAt']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Associations
ScheduledReport.belongsTo(require('./ReportTemplate'), {
  foreignKey: 'templateId',
  as: 'template'
});

ScheduledReport.belongsTo(require('./User'), {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = ScheduledReport;