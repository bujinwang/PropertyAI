const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Property = require('./Property'); // Assume association

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  screeningStatus: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      status: 'pending',
      riskLevel: 'medium',
      reportId: null,
    },
  },
  matchingProfile: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Stripe customer ID for payment processing'
  },
  paymentMethods: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      cards: [],
      ach: null,
    },
    comment: 'Legacy payment methods storage - prefer PaymentMethod model'
  },
  subscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Risk assessment fields
  lastRiskAssessment: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of last comprehensive risk assessment'
  },
  overallRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Current overall risk score (0.0-5.0 scale)'
  },
  riskLevel: {
    type: DataTypes.ENUM('minimal', 'low', 'medium', 'high', 'critical'),
    allowNull: true,
    comment: 'Current risk severity level'
  },
  churnRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Churn probability risk score'
  },
  paymentRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Payment reliability risk score'
  },
  behavioralRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Behavioral/compliance risk score'
  },
  financialRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Financial stability risk score'
  },
  satisfactionRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Tenant satisfaction risk score'
  },
  riskTrend: {
    type: DataTypes.ENUM('improving', 'stable', 'worsening'),
    allowNull: true,
    comment: 'Overall risk trend direction'
  },
  riskTrendValue: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Quantitative risk trend value (percentage change)'
  },
  nextRiskAssessment: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Scheduled date for next risk assessment'
  },
  criticalAlertsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of active critical risk alerts'
  },
  highAlertsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of active high risk alerts'
  },
  // Enhanced tenant risk tracking
  paymentHistory: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Historical payment data for risk assessment'
  },
  leaseViolations: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Record of lease violations and incidents'
  },
  complaintHistory: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Historical complaint and maintenance request data'
  },
  renewalLikelihood: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'Probability of lease renewal (0.0-1.0)'
  },
  marketSatisfaction: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    validate: {
      min: 1.0,
      max: 5.0
    },
    comment: 'Tenant satisfaction rating (1.0-5.0 scale)'
  },
  riskMetadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional risk-related metadata and historical data'
  }
}, {
  tableName: 'tenants',
  timestamps: true,
});

// Associations
Tenant.belongsTo(Property, { foreignKey: 'propertyId' }); // Assume property association
const PaymentMethod = require('./PaymentMethod');
Tenant.hasMany(PaymentMethod, {
  foreignKey: 'tenantId',
  as: 'paymentMethods'
});

module.exports = Tenant;