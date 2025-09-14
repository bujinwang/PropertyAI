const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Invoice = require('./Invoice');
const Tenant = require('./Tenant');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Invoice,
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
  },
  stripeChargeId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
});

// Associations
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });
Payment.belongsTo(Tenant, { foreignKey: 'tenantId' });
Invoice.hasMany(Payment, { foreignKey: 'invoiceId' });
Tenant.hasMany(Payment, { foreignKey: 'tenantId' });

module.exports = Payment;