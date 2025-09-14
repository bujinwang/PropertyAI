const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize; // Assume existing connection

const MarketplaceMatch = sequelize.define('MarketplaceMatch', {
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
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Properties',
      key: 'id',
    },
  },
  matchScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  recommendationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('generated', 'reviewed', 'accepted', 'rejected'),
    defaultValue: 'generated',
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
MarketplaceMatch.belongsTo(require('./Tenant'), { foreignKey: 'tenantId' });
MarketplaceMatch.belongsTo(require('./Property'), { foreignKey: 'propertyId' });

module.exports = MarketplaceMatch;