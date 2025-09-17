const { DataTypes } = require('sequelize');
const sequelize = require('./config/database-legacy');

const MaintenanceHistory = sequelize.define('MaintenanceHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM(
      'plumbing',
      'electrical',
      'hvac',
      'roofing',
      'appliance',
      'structural',
      'painting',
      'flooring',
      'pest_control',
      'landscaping',
      'security',
      'other'
    ),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'completed',
  },
  contractor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  predictedFailure: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'maintenance_history',
  timestamps: true,
  indexes: [
    {
      fields: ['propertyId', 'date'],
    },
    {
      fields: ['type', 'date'],
    },
    {
      fields: ['status'],
    },
  ],
});

// Associations
const Property = require('./Property');
MaintenanceHistory.belongsTo(Property, { foreignKey: 'propertyId' });

module.exports = MaintenanceHistory;