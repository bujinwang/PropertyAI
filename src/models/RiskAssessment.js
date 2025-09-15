/**
 * Risk Assessment Model
 * Tracks comprehensive risk assessments for properties and tenants
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RiskAssessment = sequelize.define('RiskAssessment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // Entity being assessed
  entityType: {
    type: DataTypes.ENUM('property', 'tenant', 'portfolio'),
    allowNull: false
  },

  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the property, tenant, or portfolio being assessed'
  },

  // Assessment metadata
  assessmentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },

  assessedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User ID who performed the assessment'
  },

  // Overall risk score
  overallRiskScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 5
    }
  },

  riskLevel: {
    type: DataTypes.ENUM('minimal', 'low', 'medium', 'high', 'critical'),
    allowNull: false
  },

  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Confidence level in the assessment (0-1)'
  },

  // Risk category scores
  maintenanceRisk: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },

  marketRisk: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },

  financialRisk: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },

  operationalRisk: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },

  churnRisk: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },

  complianceRisk: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },

  // Assessment details
  assessmentPeriod: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly'),
    defaultValue: 'monthly'
  },

  dataSources: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of data sources used for assessment'
  },

  keyFindings: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Key findings from the assessment'
  },

  recommendations: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Recommended actions to mitigate risks'
  },

  // Trend analysis
  previousRiskScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Previous assessment score for trend analysis'
  },

  riskTrend: {
    type: DataTypes.ENUM('improving', 'stable', 'deteriorating'),
    allowNull: true
  },

  // Alert settings
  alertThreshold: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 3.0,
    comment: 'Risk score threshold for alerts'
  },

  lastAlertSent: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Audit trail
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'risk_assessments',
  indexes: [
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['assessmentDate']
    },
    {
      fields: ['riskLevel']
    },
    {
      fields: ['overallRiskScore']
    },
    {
      fields: ['assessedBy']
    }
  ]
});

// Instance methods
RiskAssessment.prototype.getRiskFactors = async function() {
  return await this.sequelize.models.RiskFactor.findAll({
    where: { assessmentId: this.id }
  });
};

RiskAssessment.prototype.calculateOverallRisk = function() {
  const categories = [
    this.maintenanceRisk,
    this.marketRisk,
    this.financialRisk,
    this.operationalRisk,
    this.churnRisk,
    this.complianceRisk
  ];

  // Weighted average with different weights for different risk types
  const weights = [0.2, 0.15, 0.2, 0.15, 0.15, 0.15]; // Total = 1.0
  let weightedSum = 0;

  for (let i = 0; i < categories.length; i++) {
    weightedSum += categories[i] * weights[i];
  }

  this.overallRiskScore = Math.round(weightedSum * 100) / 100;

  // Determine risk level
  if (this.overallRiskScore >= 4.0) {
    this.riskLevel = 'critical';
  } else if (this.overallRiskScore >= 3.0) {
    this.riskLevel = 'high';
  } else if (this.overallRiskScore >= 2.0) {
    this.riskLevel = 'medium';
  } else if (this.overallRiskScore >= 1.0) {
    this.riskLevel = 'low';
  } else {
    this.riskLevel = 'minimal';
  }

  return this.overallRiskScore;
};

RiskAssessment.prototype.shouldTriggerAlert = function() {
  return this.overallRiskScore >= this.alertThreshold &&
         (!this.lastAlertSent || Date.now() - this.lastAlertSent > 24 * 60 * 60 * 1000); // 24 hours
};

RiskAssessment.prototype.updateTrend = function() {
  if (!this.previousRiskScore) {
    this.riskTrend = 'stable';
    return;
  }

  const change = this.overallRiskScore - this.previousRiskScore;

  if (Math.abs(change) < 0.2) {
    this.riskTrend = 'stable';
  } else if (change > 0) {
    this.riskTrend = 'deteriorating';
  } else {
    this.riskTrend = 'improving';
  }
};

module.exports = RiskAssessment;