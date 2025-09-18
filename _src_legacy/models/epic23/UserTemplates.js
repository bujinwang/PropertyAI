const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assume shared sequelize instance

const UserTemplate = sequelize.define('UserTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users', // Assume User model
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  layout: {
    type: DataTypes.JSON, // Store components layout as JSON
    allowNull: false,
    validate: {
      len: [1, 10000], // Size limit
    },
  },
  role: {
    type: DataTypes.STRING, // 'admin', 'manager', etc.
    allowNull: false,
  },
  isShared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sharedWith: {
    type: DataTypes.JSON, // Array of user IDs or roles
    defaultValue: [],
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
  tableName: 'user_templates',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'templateName'],
      unique: true,
    },
    {
      fields: ['role'],
    },
  ],
});

// Associations
UserTemplate.belongsTo(require('./User'), { foreignKey: 'userId', as: 'user' });

module.exports = UserTemplate;