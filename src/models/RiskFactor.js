const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RiskFactor = sequelize.define('RiskFactor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assessmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'risk_assessments',
      key: 'id'
    },
    comment: 'Reference to the risk assessment this factor belongs to'
  },
  category: {
    type: DataTypes.ENUM(
      'maintenance',
      'churn',
      'market',
      'financial',
      'operational',
      'compliance',
      'behavioral',
      'payment',
      'satisfaction',
      'concentration'
    ),
    allowNull: false,
    comment: 'Risk category this factor belongs to'
  },
  factorType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Specific type of risk factor (e.g., "equipment_age", "payment_delays")'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Human-readable name of the risk factor'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description of the risk factor'
  },
  score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Risk score for this specific factor (0.0-5.0 scale)'
  },
  weight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'Weight of this factor in overall assessment (0.0-1.0)'
  },
  impact: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Potential impact if this risk materializes (0.0-5.0 scale)'
  },
  probability: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'Probability of this risk occurring (0.0-1.0)'
  },
  confidence: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'Confidence level in this factor assessment'
  },
  dataSource: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Source of data used for this factor assessment'
  },
  dataQuality: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'Quality score of data used for this factor'
  },
  trend: {
    type: DataTypes.ENUM('improving', 'stable', 'worsening', 'unknown'),
    allowNull: false,
    defaultValue: 'unknown',
    comment: 'Trend direction for this risk factor'
  },
  trendValue: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Quantitative value representing the trend (e.g., percentage change)'
  },
  mitigationStatus: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'not_applicable'),
    allowNull: false,
    defaultValue: 'not_started',
    comment: 'Current status of mitigation efforts for this factor'
  },
  mitigationNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes about mitigation efforts or recommendations'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Last time this factor was updated'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional metadata specific to this risk factor'
  }
}, {
  tableName: 'risk_factors',
  indexes: [
    {
      fields: ['assessmentId'],
      name: 'idx_risk_factor_assessment'
    },
    {
      fields: ['category'],
      name: 'idx_risk_factor_category'
    },
    {
      fields: ['factorType'],
      name: 'idx_risk_factor_type'
    },
    {
      fields: ['score'],
      name: 'idx_risk_factor_score'
    },
    {
      fields: ['trend'],
      name: 'idx_risk_factor_trend'
    },
    {
      fields: ['mitigationStatus'],
      name: 'idx_risk_factor_mitigation'
    }
  ],
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Instance methods
RiskFactor.prototype.getWeightedScore = function() {
  return parseFloat(this.score) * parseFloat(this.weight);
};

RiskFactor.prototype.getRiskLevel = function() {
  const score = parseFloat(this.score);

  if (score >= 4.0) return 'critical';
  if (score >= 3.0) return 'high';
  if (score >= 2.0) return 'medium';
  if (score >= 1.0) return 'low';
  return 'minimal';
};

RiskFactor.prototype.getImpactLevel = function() {
  const impact = parseFloat(this.impact);

  if (impact >= 4.0) return 'severe';
  if (impact >= 3.0) return 'high';
  if (impact >= 2.0) return 'moderate';
  if (impact >= 1.0) return 'low';
  return 'minimal';
};

RiskFactor.prototype.getProbabilityLevel = function() {
  const probability = parseFloat(this.probability);

  if (probability >= 0.8) return 'very_high';
  if (probability >= 0.6) return 'high';
  if (probability >= 0.4) return 'moderate';
  if (probability >= 0.2) return 'low';
  return 'very_low';
};

RiskFactor.prototype.isMitigationRequired = function() {
  const score = parseFloat(this.score);
  return score >= 3.0; // High or Critical risk levels
};

RiskFactor.prototype.getDaysSinceUpdate = function() {
  const now = new Date();
  const lastUpdate = new Date(this.lastUpdated);
  const diffTime = now - lastUpdate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

RiskFactor.prototype.needsUpdate = function(maxAgeDays = 30) {
  return this.getDaysSinceUpdate() > maxAgeDays;
};

module.exports = RiskFactor;