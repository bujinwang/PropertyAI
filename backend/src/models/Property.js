const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalUnits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  yearBuilt: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  propertyType: {
    type: DataTypes.ENUM('apartment', 'house', 'condo', 'townhouse', 'commercial'),
    allowNull: false,
    defaultValue: 'apartment',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    allowNull: false,
    defaultValue: 'active',
  },
  // Market intelligence fields
  marketValue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Current estimated market value'
  },
  lastMarketAssessment: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of last market assessment'
  },
  marketTrend: {
    type: DataTypes.ENUM('increasing', 'decreasing', 'stable'),
    allowNull: true,
    comment: 'Current market trend'
  },
  marketTrendPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Market trend percentage change'
  },
  vacancyRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Current vacancy rate percentage'
  },
  avgRent2BR: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Average 2BR rent in the area'
  },
  avgRent1BR: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Average 1BR rent in the area'
  },
  competitivePosition: {
    type: DataTypes.ENUM('premium', 'market', 'value'),
    allowNull: true,
    comment: 'Property position relative to market'
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
  maintenanceRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Maintenance-related risk score'
  },
  marketRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Market-related risk score'
  },
  financialRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Financial risk score'
  },
  operationalRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Operational risk score'
  },
  complianceRiskScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 5.0
    },
    comment: 'Compliance-related risk score'
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
  riskMetadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional risk-related metadata and historical data'
  }
}, {
  tableName: 'properties',
  timestamps: true,
});

// Associations will be defined in index.js or associations file
// Property.hasMany(Tenant, { foreignKey: 'propertyId' });

module.exports = Property;