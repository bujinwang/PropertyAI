const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize; // Assume existing connection

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
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  leaseStart: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  leaseEnd: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'pending', 'evicted'),
    defaultValue: 'pending',
  },
  unitId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Units',
      key: 'id',
    },
  },
  matchingProfile: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      overallScore: 0,
      financialScore: 0,
      historyScore: 0,
      preferenceScore: 0,
    },
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
Tenant.belongsTo(require('./Unit'), { foreignKey: 'unitId' });

module.exports = Tenant;