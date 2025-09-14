const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplianceCheck = sequelize.define('ComplianceCheck', {
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
  checkType: {
    type: DataTypes.ENUM(
      'gdpr', 'sox', 'hipaa', 'ccpa', 'data_retention',
      'pii_detection', 'sensitive_data', 'export_controls',
      'audit_trail', 'data_accuracy', 'consent_tracking'
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'passed', 'failed', 'exempted'),
    allowNull: false,
    defaultValue: 'pending'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium'
  },
  findings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  violations: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  recommendations: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  dataClassification: {
    type: DataTypes.ENUM('public', 'internal', 'confidential', 'restricted'),
    allowNull: false,
    defaultValue: 'internal'
  },
  jurisdictions: {
    type: DataTypes.JSONB, // Array of applicable jurisdictions/regions
    allowNull: true,
    defaultValue: []
  },
  exempted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  exemptionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextReviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  initiatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processingTime: {
    type: DataTypes.INTEGER, // milliseconds
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
  tableName: 'ComplianceChecks',
  indexes: [
    {
      fields: ['reportId']
    },
    {
      fields: ['templateId']
    },
    {
      fields: ['checkType']
    },
    {
      fields: ['status']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['dataClassification']
    },
    {
      fields: ['nextReviewDate']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeUpdate: (complianceCheck) => {
      if (complianceCheck.status === 'passed' || complianceCheck.status === 'failed') {
        if (!complianceCheck.completedAt) {
          complianceCheck.completedAt = new Date();
        }
      }
    }
  }
});

// Associations
ComplianceCheck.belongsTo(require('./GeneratedReport'), {
  foreignKey: 'reportId',
  as: 'report'
});

ComplianceCheck.belongsTo(require('./ReportTemplate'), {
  foreignKey: 'templateId',
  as: 'template'
});

ComplianceCheck.belongsTo(require('./User'), {
  foreignKey: 'initiatedBy',
  as: 'initiator'
});

ComplianceCheck.belongsTo(require('./User'), {
  foreignKey: 'approvedBy',
  as: 'approver'
});

module.exports = ComplianceCheck;