const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize;

const ScreeningLog = sequelize.define('ScreeningLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reportId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ScreeningReports',
      key: 'id',
    },
  },
  checkType: {
    type: DataTypes.ENUM('credit', 'background', 'reference', 'ai_risk'),
    allowNull: false,
  },
  result: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    defaultValue: 'pending',
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Associations
ScreeningLog.belongsTo(require('./ScreeningReport'), { foreignKey: 'reportId' });

module.exports = ScreeningLog;