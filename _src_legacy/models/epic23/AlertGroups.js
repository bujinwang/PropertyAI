const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assume shared sequelize instance

const AlertGroup = sequelize.define('AlertGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  groupType: {
    type: DataTypes.ENUM('maintenance', 'churn', 'market'),
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Properties',
      key: 'id',
    },
  },
  alertCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'alert_groups',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['groupType', 'priority', 'propertyId'],
    },
    {
      fields: ['propertyId'],
    },
  ],
});

// Association with existing Alert model (assume Alert has groupId FK)
AlertGroup.hasMany(require('./Alert'), { foreignKey: 'groupId', as: 'alerts' });
require('./Alert').belongsTo(AlertGroup, { foreignKey: 'groupId', as: 'group' });

// Migration note: Add migration for table and FK on Alert.groupId

module.exports = AlertGroup;