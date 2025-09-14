const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RiskAssessment = sequelize.define('RiskAssessment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entityType: {
    type: DataTypes.ENUM('property', 'tenant', 'portfolio'),
    allowNull: false,
    comment: 'Type of entity being assessed'
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the property, tenant, or portfolio'
  },
  assessmentType: {
    type: DataTypes.ENUM('comprehensive', 'maintenance', 'churn', 'market', 'financial', 'operational', 'compliance'),
    allowNull: false,
    comment: 'Type of risk assessment performed'
  },
  overallRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Overall risk score (0.0-5.0 scale)'
  },
  riskLevel: {
    type: DataTypes.ENUM('minimal', 'low', 'medium', 'high', 'critical'),
    allowNull: false,
    comment: 'Risk severity level'
  },
  confidence: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'Confidence level in the assessment (0.0-1.0)'
  },
  riskFactors: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Detailed risk factors with scores and weights'
  },
  mitigationStrategies: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Recommended mitigation strategies'
  },
  trendData: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Historical risk trend data for forecasting'
  },
  alertsTriggered: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'List of alerts triggered by this assessment'
  },
  assessmentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date when assessment was performed'
  },
  nextAssessmentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Scheduled date for next assessment'
  },
  dataQuality: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'Quality score of input data used for assessment'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional metadata about the assessment'
  }
}, {
  tableName: 'risk_assessments',
  indexes: [
    {
      fields: ['entityType', 'entityId'],
      name: 'idx_risk_assessment_entity'
    },
    {
      fields: ['assessmentType'],
      name: 'idx_risk_assessment_type'
    },
    {
      fields: ['riskLevel'],
      name: 'idx_risk_assessment_level'
    },
    {
      fields: ['assessmentDate'],
      name: 'idx_risk_assessment_date'
    },
    {
      fields: ['overallRiskScore'],
      name: 'idx_risk_assessment_score'
    }
  ],
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Instance methods
RiskAssessment.prototype.getRiskFactorsByCategory = function(category) {
  const factors = this.riskFactors || {};
  return factors[category] || [];
};

RiskAssessment.prototype.getTopRiskFactors = function(limit = 5) {
  const allFactors = [];
  const factors = this.riskFactors || {};

  Object.keys(factors).forEach(category => {
    factors[category].forEach(factor => {
      allFactors.push({
        ...factor,
        category
      });
    });
  });

  return allFactors
    .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
    .slice(0, limit);
};

RiskAssessment.prototype.getMitigationPriority = function() {
  const score = parseFloat(this.overallRiskScore);

  if (score >= 4.0) return 'immediate';
  if (score >= 3.0) return 'urgent';
  if (score >= 2.0) return 'high';
  if (score >= 1.0) return 'medium';
  return 'low';
};

RiskAssessment.prototype.isExpired = function() {
  if (!this.nextAssessmentDate) return false;
  return new Date() > new Date(this.nextAssessmentDate);
};

RiskAssessment.prototype.getDaysUntilExpiry = function() {
  if (!this.nextAssessmentDate) return null;
  const now = new Date();
  const expiry = new Date(this.nextAssessmentDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = RiskAssessment;