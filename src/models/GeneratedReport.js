/**
 * GeneratedReport Model
 * Stores generated reports with AI insights and metadata
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeneratedReport = sequelize.define('GeneratedReport', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  parameters: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Parameters used to generate the report'
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Raw data used in report generation'
  },
  insights: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'AI-generated insights and analysis'
  },
  recommendations: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Actionable recommendations with priority scoring'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Report metadata including confidence scores, processing time, etc.'
  },
  status: {
    type: DataTypes.ENUM('generating', 'completed', 'failed', 'expired'),
    allowNull: false,
    defaultValue: 'generating'
  },
  format: {
    type: DataTypes.ENUM('json', 'pdf', 'csv', 'excel'),
    allowNull: false,
    defaultValue: 'json',
    comment: 'Primary format of the generated report'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Size of generated file in bytes'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of times report has been downloaded'
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time report was accessed'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the report expires and should be cleaned up'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether report is publicly accessible'
  },
  accessToken: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Token for secure access to private reports'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipientEmails: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Email addresses that received this report'
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Tags for categorization and search'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Report version for change tracking'
  },
  processingTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Time taken to generate report in milliseconds'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if report generation failed'
  },
  auditTrail: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Audit trail of report access and modifications'
  }
}, {
  tableName: 'generated_reports',
  indexes: [
    {
      fields: ['templateId']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['status']
    },
    {
      fields: ['generatedAt']
    },
    {
      fields: ['expiresAt']
    },
    {
      fields: ['isPublic']
    },
    {
      fields: ['tags'],
      using: 'gin'
    },
    {
      fields: ['recipientEmails'],
      using: 'gin'
    }
  ],
  hooks: {
    beforeCreate: (report) => {
      // Set expiration date (default 90 days)
      if (!report.expiresAt) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 90);
        report.expiresAt = expirationDate;
      }

      // Generate access token for private reports
      if (!report.isPublic && !report.accessToken) {
        report.accessToken = require('crypto').randomUUID();
      }
    },
    beforeUpdate: (report) => {
      // Update last accessed time when downloaded
      if (report.changed('downloadCount')) {
        report.lastAccessedAt = new Date();
      }
    }
  }
});

// Instance methods
GeneratedReport.prototype.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

GeneratedReport.prototype.markAsAccessed = function() {
  this.lastAccessedAt = new Date();
  this.downloadCount += 1;
  return this.save();
};

GeneratedReport.prototype.addToAuditTrail = function(action, userId, details = {}) {
  const auditEntry = {
    timestamp: new Date(),
    action,
    userId,
    details,
    ipAddress: details.ipAddress || null,
    userAgent: details.userAgent || null
  };

  this.auditTrail = this.auditTrail || [];
  this.auditTrail.push(auditEntry);

  return this.save();
};

GeneratedReport.prototype.getInsightsCount = function() {
  return this.insights ? this.insights.length : 0;
};

GeneratedReport.prototype.getRecommendationsCount = function() {
  return this.recommendations ? this.recommendations.length : 0;
};

GeneratedReport.prototype.getHighPriorityRecommendations = function() {
  return this.recommendations ?
    this.recommendations.filter(rec => rec.priority === 'high') : [];
};

GeneratedReport.prototype.getOverallConfidence = function() {
  if (!this.metadata || !this.metadata.confidence) {
    return 0;
  }
  return this.metadata.confidence;
};

GeneratedReport.prototype.getDataSources = function() {
  if (!this.metadata || !this.metadata.dataSources) {
    return [];
  }
  return this.metadata.dataSources;
};

GeneratedReport.prototype.extendExpiration = function(days = 30) {
  const newExpirationDate = new Date(this.expiresAt || new Date());
  newExpirationDate.setDate(newExpirationDate.getDate() + days);
  this.expiresAt = newExpirationDate;
  return this.save();
};

GeneratedReport.prototype.clone = function(newParameters = {}) {
  const clonedData = { ...this.data };
  const clonedParameters = { ...this.parameters, ...newParameters };

  return GeneratedReport.create({
    templateId: this.templateId,
    templateName: this.templateName,
    parameters: clonedParameters,
    data: clonedData,
    insights: [], // Will be regenerated
    recommendations: [], // Will be regenerated
    metadata: { ...this.metadata },
    status: 'generating',
    createdBy: this.createdBy,
    tags: [...this.tags],
    auditTrail: [{
      timestamp: new Date(),
      action: 'cloned',
      userId: this.createdBy,
      details: { originalReportId: this.id }
    }]
  });
};

GeneratedReport.prototype.toPublicJSON = function() {
  const values = { ...this.get() };

  // Remove sensitive data for public access
  delete values.accessToken;
  delete values.auditTrail;
  delete values.errorMessage;

  // Remove internal metadata
  if (values.metadata) {
    delete values.metadata.processingTime;
  }

  return values;
};

GeneratedReport.prototype.toSummaryJSON = function() {
  return {
    id: this.id,
    templateId: this.templateId,
    templateName: this.templateName,
    generatedAt: this.generatedAt,
    status: this.status,
    format: this.format,
    fileSize: this.fileSize,
    downloadCount: this.downloadCount,
    expiresAt: this.expiresAt,
    isExpired: this.isExpired(),
    insightsCount: this.getInsightsCount(),
    recommendationsCount: this.getRecommendationsCount(),
    overallConfidence: this.getOverallConfidence(),
    tags: this.tags
  };
};

// Class methods
GeneratedReport.findActive = function(userId) {
  return this.findAll({
    where: {
      createdBy: userId,
      status: 'completed',
      expiresAt: {
        [require('sequelize').Op.gt]: new Date()
      }
    },
    order: [['generatedAt', 'DESC']]
  });
};

GeneratedReport.findByTemplate = function(templateId, userId) {
  return this.findAll({
    where: {
      templateId,
      createdBy: userId,
      status: 'completed'
    },
    order: [['generatedAt', 'DESC']]
  });
};

GeneratedReport.cleanupExpired = function() {
  return this.destroy({
    where: {
      expiresAt: {
        [require('sequelize').Op.lt]: new Date()
      }
    }
  });
};

module.exports = GeneratedReport;