const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const Tenant = require('../models/Tenant');
const PaymentMethod = require('../models/PaymentMethod');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param, validationResult } = require('express-validator');
const { handleAsyncError, handleValidationErrors } = require('../middleware/errorMiddleware');

// Validation middleware
const validateCustomerCreation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number format'),
  handleValidationErrors
];

const validateCustomerId = [
  param('customerId').matches(/^cus_[a-zA-Z0-9]+$/).withMessage('Invalid Stripe customer ID format'),
  handleValidationErrors
];

const validatePaymentMethodId = [
  param('paymentMethodId').matches(/^pm_[a-zA-Z0-9]+$/).withMessage('Invalid Stripe payment method ID format'),
  handleValidationErrors
];

const validateSetupIntent = [
  body('paymentMethodId').matches(/^pm_[a-zA-Z0-9]+$/).withMessage('Invalid payment method ID'),
  body('setAsDefault').optional().isBoolean().withMessage('setAsDefault must be a boolean'),
  handleValidationErrors
];

/**
 * POST /api/payments/setup-customer
 * Create a new Stripe customer for a tenant
 */
router.post('/setup-customer', [
  authMiddleware,
  validateCustomerCreation
], handleAsyncError(async (req, res) => {
  const { email, name, phone } = req.body;
  const tenantId = req.user.id; // Assuming user is tenant

  // Check if tenant already has a Stripe customer
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({
      error: 'Tenant not found',
      message: 'The specified tenant does not exist'
    });
  }

  if (tenant.stripeCustomerId) {
    return res.status(409).json({
      error: 'Customer already exists',
      message: 'This tenant already has a Stripe customer account',
      customerId: tenant.stripeCustomerId
    });
  }

  try {
    // Create Stripe customer
    const customerData = {
      email,
      name,
      phone,
      tenantId,
      propertyId: tenant.propertyId, // Assuming tenant has property association
      metadata: {
        tenantId: tenantId,
        createdVia: 'api'
      }
    };

    const stripeCustomer = await stripeService.createCustomer(customerData);

    // Update tenant with Stripe customer ID
    await tenant.update({ stripeCustomerId: stripeCustomer.id });

    res.status(201).json({
      success: true,
      message: 'Stripe customer created successfully',
      customer: stripeCustomer,
      tenantId: tenantId
    });

  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    res.status(500).json({
      error: 'Customer creation failed',
      message: 'Unable to create Stripe customer account'
    });
  }
}));

/**
 * GET /api/payments/customer
 * Retrieve Stripe customer information for the authenticated tenant
 */
router.get('/customer', authMiddleware, handleAsyncError(async (req, res) => {
  const tenantId = req.user.id;

  // Get tenant with Stripe customer ID
  const tenant = await Tenant.findByPk(tenantId, {
    attributes: ['id', 'stripeCustomerId', 'name', 'email', 'phone']
  });

  if (!tenant) {
    return res.status(404).json({
      error: 'Tenant not found',
      message: 'The specified tenant does not exist'
    });
  }

  if (!tenant.stripeCustomerId) {
    return res.status(404).json({
      error: 'Customer not found',
      message: 'No Stripe customer account found for this tenant'
    });
  }

  try {
    // Retrieve customer from Stripe
    const stripeCustomer = await stripeService.getCustomer(tenant.stripeCustomerId);

    res.json({
      success: true,
      customer: {
        ...stripeCustomer,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantEmail: tenant.email
      }
    });

  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);

    if (error.message.includes('deleted')) {
      // Customer was deleted in Stripe, clean up local reference
      await tenant.update({ stripeCustomerId: null });
      return res.status(404).json({
        error: 'Customer not found',
        message: 'Stripe customer account has been deleted'
      });
    }

    res.status(500).json({
      error: 'Customer retrieval failed',
      message: 'Unable to retrieve Stripe customer information'
    });
  }
}));

/**
 * PUT /api/payments/customer
 * Update Stripe customer information
 */
router.put('/customer', [
  authMiddleware,
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number format'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const tenantId = req.user.id;
  const updateData = req.body;

  // Get tenant
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({
      error: 'Tenant not found',
      message: 'The specified tenant does not exist'
    });
  }

  if (!tenant.stripeCustomerId) {
    return res.status(404).json({
      error: 'Customer not found',
      message: 'No Stripe customer account found for this tenant'
    });
  }

  try {
    // Update Stripe customer
    const updatedCustomer = await stripeService.updateCustomer(tenant.stripeCustomerId, updateData);

    // Update local tenant data if email/name changed
    const localUpdates = {};
    if (updateData.email) localUpdates.email = updateData.email;
    if (updateData.name) localUpdates.name = updateData.name;
    if (updateData.phone !== undefined) localUpdates.phone = updateData.phone;

    if (Object.keys(localUpdates).length > 0) {
      await tenant.update(localUpdates);
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Error updating Stripe customer:', error);
    res.status(500).json({
      error: 'Customer update failed',
      message: 'Unable to update Stripe customer information'
    });
  }
}));

/**
 * DELETE /api/payments/customer
 * Delete Stripe customer (use with caution)
 */
router.delete('/customer', authMiddleware, handleAsyncError(async (req, res) => {
  const tenantId = req.user.id;

  // Get tenant
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({
      error: 'Tenant not found',
      message: 'The specified tenant does not exist'
    });
  }

  if (!tenant.stripeCustomerId) {
    return res.status(404).json({
      error: 'Customer not found',
      message: 'No Stripe customer account found for this tenant'
    });
  }

  try {
    // Delete Stripe customer
    const deletionResult = await stripeService.deleteCustomer(tenant.stripeCustomerId);

    // Remove local reference
    await tenant.update({ stripeCustomerId: null });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
      deletion: deletionResult
    });

  } catch (error) {
    console.error('Error deleting Stripe customer:', error);
    res.status(500).json({
      error: 'Customer deletion failed',
      message: 'Unable to delete Stripe customer account'
    });
  }
}));

/**
 * POST /api/payments/setup-payment-method
 * Attach and save a payment method for the authenticated tenant
 */
router.post('/setup-payment-method', [
  authMiddleware,
  validateSetupIntent
], handleAsyncError(async (req, res) => {
  const { paymentMethodId, setAsDefault = false } = req.body;
  const tenantId = req.user.id;

  // Get tenant with Stripe customer ID
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({
      error: 'Tenant not found',
      message: 'The specified tenant does not exist'
    });
  }

  if (!tenant.stripeCustomerId) {
    return res.status(400).json({
      error: 'Customer not found',
      message: 'Tenant must have a Stripe customer account before adding payment methods'
    });
  }

  try {
    // Attach payment method to Stripe customer
    const attachedPaymentMethod = await stripeService.attachPaymentMethod(
      tenant.stripeCustomerId,
      paymentMethodId,
      setAsDefault
    );

    // Save payment method to database
    const PaymentMethod = require('../models/PaymentMethod');
    const paymentMethodRecord = await PaymentMethod.create({
      tenantId,
      stripePaymentMethodId: attachedPaymentMethod.id,
      type: attachedPaymentMethod.type,
      cardBrand: attachedPaymentMethod.card?.brand,
      cardLast4: attachedPaymentMethod.card?.last4,
      cardExpMonth: attachedPaymentMethod.card?.exp_month,
      cardExpYear: attachedPaymentMethod.card?.exp_year,
      bankName: attachedPaymentMethod.us_bank_account?.bank_name,
      bankLast4: attachedPaymentMethod.us_bank_account?.last4,
      bankRoutingNumber: attachedPaymentMethod.us_bank_account?.routing_number,
      isDefault: attachedPaymentMethod.isDefault,
      metadata: {
        attachedAt: new Date().toISOString(),
        attachedBy: req.user.id
      },
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethod: {
        id: paymentMethodRecord.id,
        type: paymentMethodRecord.type,
        displayName: paymentMethodRecord.getDisplayName(),
        isDefault: paymentMethodRecord.isDefault,
        created: paymentMethodRecord.createdAt
      }
    });

  } catch (error) {
    console.error('Error setting up payment method:', error);
    res.status(500).json({
      error: 'Payment method setup failed',
      message: 'Unable to add payment method'
    });
  }
}));

/**
 * GET /api/payments/payment-methods
 * List all payment methods for the authenticated tenant
 */
router.get('/payment-methods', authMiddleware, handleAsyncError(async (req, res) => {
  const tenantId = req.user.id;

  try {
    const PaymentMethod = require('../models/PaymentMethod');
    const paymentMethods = await PaymentMethod.findAll({
      where: {
        tenantId,
        isActive: true
      },
      order: [
        ['isDefault', 'DESC'], // Default methods first
        ['createdAt', 'DESC']  // Then by creation date
      ]
    });

    const formattedMethods = paymentMethods.map(pm => ({
      id: pm.id,
      stripeId: pm.stripePaymentMethodId,
      type: pm.type,
      displayName: pm.getDisplayName(),
      isDefault: pm.isDefault,
      isExpired: pm.isExpired(),
      expirationStatus: pm.getExpirationStatus(),
      created: pm.createdAt,
      // Include card/bank specific details
      ...(pm.type === 'card' && {
        card: {
          brand: pm.cardBrand,
          last4: pm.cardLast4,
          expMonth: pm.cardExpMonth,
          expYear: pm.cardExpYear
        }
      }),
      ...(pm.type === 'us_bank_account' && {
        bank: {
          name: pm.bankName,
          last4: pm.bankLast4,
          routingNumber: pm.bankRoutingNumber
        }
      })
    }));

    res.json({
      success: true,
      paymentMethods: formattedMethods,
      count: formattedMethods.length
    });

  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    res.status(500).json({
      error: 'Payment methods retrieval failed',
      message: 'Unable to retrieve payment methods'
    });
  }
}));

/**
 * DELETE /api/payments/payment-methods/:id
 * Remove a payment method for the authenticated tenant
 */
router.delete('/payment-methods/:id', [
  authMiddleware,
  param('id').isUUID().withMessage('Invalid payment method ID format'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const paymentMethodId = req.params.id;
  const tenantId = req.user.id;

  try {
    const PaymentMethod = require('../models/PaymentMethod');

    // Find the payment method
    const paymentMethod = await PaymentMethod.findOne({
      where: {
        id: paymentMethodId,
        tenantId,
        isActive: true
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({
        error: 'Payment method not found',
        message: 'The specified payment method does not exist or is inactive'
      });
    }

    // Detach from Stripe
    await stripeService.detachPaymentMethod(paymentMethod.stripePaymentMethodId);

    // Soft delete from database (mark as inactive)
    await paymentMethod.update({
      isActive: false,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Payment method removed successfully',
      paymentMethodId: paymentMethodId
    });

  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({
      error: 'Payment method removal failed',
      message: 'Unable to remove payment method'
    });
  }
}));

/**
 * PUT /api/payments/payment-methods/:id/default
 * Set a payment method as the default for the tenant
 */
router.put('/payment-methods/:id/default', [
  authMiddleware,
  param('id').isUUID().withMessage('Invalid payment method ID format'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const paymentMethodId = req.params.id;
  const tenantId = req.user.id;

  try {
    const PaymentMethod = require('../models/PaymentMethod');

    // Find the payment method
    const paymentMethod = await PaymentMethod.findOne({
      where: {
        id: paymentMethodId,
        tenantId,
        isActive: true
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({
        error: 'Payment method not found',
        message: 'The specified payment method does not exist or is inactive'
      });
    }

    // Start a transaction to ensure consistency
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      // Remove default from all other payment methods
      await PaymentMethod.update(
        { isDefault: false },
        {
          where: { tenantId, isDefault: true },
          transaction
        }
      );

      // Set this payment method as default
      await paymentMethod.update(
        { isDefault: true, updatedBy: req.user.id },
        { transaction }
      );

      await transaction.commit();

      res.json({
        success: true,
        message: 'Default payment method updated successfully',
        paymentMethodId: paymentMethodId
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({
      error: 'Default payment method update failed',
      message: 'Unable to update default payment method'
    });
  }
}));

module.exports = router;