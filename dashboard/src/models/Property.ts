import { DataTypes } from 'sequelize';
import sequelize from './index'; // Assume connection

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
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
  propertyType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalUnits: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rent: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  amenities: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  matchingCriteria: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      overallScore: 0,
      locationScore: 0,
      priceScore: 0,
      amenityScore: 0,
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
Property.hasMany(sequelize.models.Unit, { foreignKey: 'propertyId' });

export default Property;