const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./Tenant');

const PaymentMethod = sequelize.define('PaymentMethod', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Tenant,
      key: 'id'
    },
    comment: 'Reference to the tenant who owns this payment method'
  },
  stripePaymentMethodId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Stripe payment method ID (pm_xxx)'
  },
  type: {
    type: DataTypes.ENUM('card', 'us_bank_account'),
    allowNull: false,
    comment: 'Type of payment method'
  },
  // Card-specific fields
  cardBrand: {
    type: DataTypes.ENUM('amex', 'diners', 'discover', 'jcb', 'mastercard', 'unionpay', 'visa', 'unknown'),
    allowNull: true,
    comment: 'Card brand (only for card type)'
  },
  cardLast4: {
    type: DataTypes.STRING(4),
    allowNull: true,
    comment: 'Last 4 digits of card number'
  },
  cardExpMonth: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 12
    },
    comment: 'Card expiration month'
  },
  cardExpYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2020,
      max: 2050
    },
    comment: 'Card expiration year'
  },
  // Bank account-specific fields
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Bank name (only for us_bank_account type)'
  },
  bankLast4: {
    type: DataTypes.STRING(4),
    allowNull: true,
    comment: 'Last 4 digits of bank account number'
  },
  bankRoutingNumber: {
    type: DataTypes.STRING(9),
    allowNull: true,
    comment: 'Bank routing number (9 digits)'
  },
  // Common fields
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is the default payment method for the tenant'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this payment method is active and usable'
  },
  // Metadata for additional information
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata from Stripe or custom fields'
  },
  // Audit fields
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User who created this payment method'
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User who last updated this payment method'
  }
}, {
  tableName: 'payment_methods',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['stripePaymentMethodId'],
      name: 'unique_stripe_payment_method_id'
    },
    {
      fields: ['tenantId'],
      name: 'payment_methods_tenant_id'
    },
    {
      fields: ['tenantId', 'isDefault'],
      name: 'payment_methods_tenant_default'
    },
    {
      fields: ['tenantId', 'isActive'],
      name: 'payment_methods_tenant_active'
    },
    {
      fields: ['type'],
      name: 'payment_methods_type'
    }
  ]
});

// Associations
PaymentMethod.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant'
});

Tenant.hasMany(PaymentMethod, {
  foreignKey: 'tenantId',
  as: 'paymentMethods'
});

// Instance methods
PaymentMethod.prototype.getDisplayName = function() {
  if (this.type === 'card') {
    return `${this.cardBrand?.toUpperCase()} **** ${this.cardLast4}`;
  } else if (this.type === 'us_bank_account') {
    return `${this.bankName} **** ${this.bankLast4}`;
  }
  return 'Unknown Payment Method';
};

PaymentMethod.prototype.isExpired = function() {
  if (this.type === 'card' && this.cardExpYear && this.cardExpMonth) {
    const now = new Date();
    const expDate = new Date(this.cardExpYear, this.cardExpMonth - 1);
    return expDate < now;
  }
  return false;
};

PaymentMethod.prototype.getExpirationStatus = function() {
  if (this.type !== 'card' || !this.cardExpYear || !this.cardExpMonth) {
    return 'unknown';
  }

  const now = new Date();
  const expDate = new Date(this.cardExpYear, this.cardExpMonth - 1);
  const monthsUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsUntilExpiry < 0) {
    return 'expired';
  } else if (monthsUntilExpiry <= 1) {
    return 'expiring_soon';
  } else if (monthsUntilExpiry <= 3) {
    return 'expiring_months';
  }
  return 'valid';
};

module.exports = PaymentMethod;