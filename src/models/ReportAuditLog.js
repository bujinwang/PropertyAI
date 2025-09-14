const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportAuditLog = sequelize.define('ReportAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reportId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'GeneratedReports',
      key: 'id'
    }
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: true,
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
  action: {
    type: DataTypes.ENUM(
      'created', 'viewed', 'exported', 'emailed', 'scheduled',
      'modified', 'deleted', 'shared', 'accessed', 'compliance_check'
    ),
    allowNull: false
  },
  resourceType: {
    type: DataTypes.ENUM('report', 'template', 'schedule', 'export'),
    allowNull: false
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  complianceFlags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true
  },
  aiConfidence: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true
  },
  processingTime: {
    type: DataTypes.INTEGER, // milliseconds
    allowNull: true
  },
  dataSensitivity: {
    type: DataTypes.ENUM('public', 'internal', 'confidential', 'restricted'),
    allowNull: true,
    defaultValue: 'internal'
  },
  retentionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'ReportAuditLogs',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['reportId']
    },
    {
      fields: ['templateId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resourceType', 'resourceId']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['dataSensitivity']
    },
    {
      fields: ['retentionDate']
    }
  ],
  hooks: {
    beforeCreate: (auditLog) => {
      // Set retention date based on data sensitivity
      if (!auditLog.retentionDate) {
        const retentionDays = {
          'public': 365,      // 1 year
          'internal': 1095,   // 3 years
          'confidential': 2555, // 7 years
          'restricted': 3650  // 10 years
        };

        const days = retentionDays[auditLog.dataSensitivity] || 1095;
        auditLog.retentionDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }
  }
});

// Associations
ReportAuditLog.belongsTo(require('./GeneratedReport'), {
  foreignKey: 'reportId',
  as: 'report'
});

ReportAuditLog.belongsTo(require('./ReportTemplate'), {
  foreignKey: 'templateId',
  as: 'template'
});

ReportAuditLog.belongsTo(require('./User'), {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = ReportAuditLog;