const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportVersion = sequelize.define('ReportVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reportId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'GeneratedReports',
      key: 'id'
    }
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  contentHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  changes: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  changeType: {
    type: DataTypes.ENUM(
      'initial', 'regenerated', 'manual_edit', 'data_refresh',
      'template_update', 'compliance_fix', 'error_correction'
    ),
    allowNull: false,
    defaultValue: 'initial'
  },
  changeReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  aiConfidence: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true
  },
  dataSources: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  complianceStatus: {
    type: DataTypes.ENUM('pending', 'passed', 'failed', 'exempted'),
    allowNull: false,
    defaultValue: 'pending'
  },
  complianceIssues: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'ReportVersions',
  indexes: [
    {
      fields: ['reportId']
    },
    {
      fields: ['reportId', 'version'],
      unique: true
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['complianceStatus']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Associations
ReportVersion.belongsTo(require('./GeneratedReport'), {
  foreignKey: 'reportId',
  as: 'report'
});

ReportVersion.belongsTo(require('./User'), {
  foreignKey: 'createdBy',
  as: 'creator'
});

module.exports = ReportVersion;