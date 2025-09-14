const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize;

const ScreeningReport = sequelize.define('ScreeningReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Tenants',
      key: 'id',
    },
  },
  creditScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 300,
      max: 850,
    },
  },
  backgroundResults: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  referenceVerification: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  aiAssessment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
});

// Associations
ScreeningReport.belongsTo(require('./Tenant'), { foreignKey: 'tenantId' });

module.exports = ScreeningReport;