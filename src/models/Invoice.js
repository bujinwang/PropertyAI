const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./Tenant');
const Unit = require('./Unit'); // Assume Unit model exists
const Payment = require('./Payment');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  unitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Unit,
      key: 'id',
    },
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Tenant,
      key: 'id',
    },
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue'),
    defaultValue: 'pending',
  },
  pdfUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'invoices',
  timestamps: true,
});

// Associations
Invoice.belongsTo(Unit, { foreignKey: 'unitId' });
Invoice.belongsTo(Tenant, { foreignKey: 'tenantId' });
Invoice.hasMany(Payment, { foreignKey: 'invoiceId' });

module.exports = Invoice;