'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add stripeCustomerId to tenants table
    await queryInterface.addColumn('tenants', 'stripeCustomerId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: 'Stripe customer ID for payment processing'
    });

    // Create payment_methods table
    await queryInterface.createTable('payment_methods', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to the tenant who owns this payment method'
      },
      stripePaymentMethodId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Stripe payment method ID (pm_xxx)'
      },
      type: {
        type: Sequelize.ENUM('card', 'us_bank_account'),
        allowNull: false,
        comment: 'Type of payment method'
      },
      // Card-specific fields
      cardBrand: {
        type: Sequelize.ENUM('amex', 'diners', 'discover', 'jcb', 'mastercard', 'unionpay', 'visa', 'unknown'),
        allowNull: true,
        comment: 'Card brand (only for card type)'
      },
      cardLast4: {
        type: Sequelize.STRING(4),
        allowNull: true,
        comment: 'Last 4 digits of card number'
      },
      cardExpMonth: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 12
        },
        comment: 'Card expiration month'
      },
      cardExpYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 2020,
          max: 2050
        },
        comment: 'Card expiration year'
      },
      // Bank account-specific fields
      bankName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Bank name (only for us_bank_account type)'
      },
      bankLast4: {
        type: Sequelize.STRING(4),
        allowNull: true,
        comment: 'Last 4 digits of bank account number'
      },
      bankRoutingNumber: {
        type: Sequelize.STRING(9),
        allowNull: true,
        comment: 'Bank routing number (9 digits)'
      },
      // Common fields
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether this is the default payment method for the tenant'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether this payment method is active and usable'
      },
      // Metadata
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional metadata from Stripe or custom fields'
      },
      // Audit fields
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User who created this payment method'
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User who last updated this payment method'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('payment_methods', ['stripePaymentMethodId'], {
      unique: true,
      name: 'unique_stripe_payment_method_id'
    });

    await queryInterface.addIndex('payment_methods', ['tenantId'], {
      name: 'payment_methods_tenant_id'
    });

    await queryInterface.addIndex('payment_methods', ['tenantId', 'isDefault'], {
      name: 'payment_methods_tenant_default'
    });

    await queryInterface.addIndex('payment_methods', ['tenantId', 'isActive'], {
      name: 'payment_methods_tenant_active'
    });

    await queryInterface.addIndex('payment_methods', ['type'], {
      name: 'payment_methods_type'
    });

    // Add foreign key constraint
    await queryInterface.addConstraint('payment_methods', {
      fields: ['tenantId'],
      type: 'foreign key',
      name: 'payment_methods_tenant_id_fk',
      references: {
        table: 'tenants',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('payment_methods', 'payment_methods_tenant_id_fk');

    // Drop payment_methods table
    await queryInterface.dropTable('payment_methods');

    // Remove stripeCustomerId column from tenants
    await queryInterface.removeColumn('tenants', 'stripeCustomerId');
  }
};