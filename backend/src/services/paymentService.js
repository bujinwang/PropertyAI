const stripeConfig = require('../../config/stripe.config');
const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const stripe = stripeConfig.stripe;
const logger = require('../utils/logger'); // Assume Winston
const { v4: uuidv4 } = require('uuid'); // For idempotency

const setupPaymentMethod = async (type, details, tenantId) => {
  try {
    let method;

    if (type === 'card') {
      // Assume details has token from Stripe Elements
      method = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: details.token,
        },
      });
    } else if (type === 'ach') {
      method = await stripe.paymentMethods.create({
        type: 'us_bank_account',
        us_bank_account: {
          routing_number: details.routingNumber,
          account_number: details.accountNumber,
          account_holder_type: 'individual', // or 'company'
        },
      });
    } else {
      throw new Error('Invalid payment type');
    }

    // Update tenant
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (!tenant.paymentMethods) {
      tenant.paymentMethods = { cards: [], ach: null };
    }

    if (type === 'card') {
      tenant.paymentMethods.cards.push(method.id);
    } else if (type === 'ach') {
      tenant.paymentMethods.ach = method.id;
    }

    await tenant.save();

    logger.info('Payment method setup successful', { tenantId, methodId: method.id, type });

    return { success: true, methodId: method.id };
  } catch (error) {
    if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
      logger.warn('Payment setup failed', { tenantId, error: error.message });
      throw new Error(`Payment setup failed: ${error.message}`); // Client 400
    }
    logger.error('Unexpected payment setup error', { tenantId, error: error.message });
    throw new Error('Internal server error'); // Client 500
  }
};

const processPayment = async (invoiceId, methodId, recurring = false, idempotencyKey = uuidv4()) => {
  try {
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [Tenant],
    });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const tenant = invoice.Tenant;
    if (!tenant.paymentMethods || !methodId || !tenant.paymentMethods.cards.includes(methodId) && tenant.paymentMethods.ach !== methodId) {
      throw new Error('Invalid payment method');
    }

    let paymentIntent;
    let payment;

    if (recurring) {
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: tenant.stripeCustomerId || await createCustomer(tenant), // Assume or create
        items: [{
          price: invoice.stripePriceId || await createPrice(invoice.amount), // Monthly price
        }],
        default_payment_method: methodId,
        idempotency_key: idempotencyKey,
      });

      payment = await Payment.create({
        invoiceId,
        tenantId: tenant.id,
        amount: invoice.amount,
        status: 'paid', // Subscription starts paid
        stripeChargeId: subscription.id,
      });

      await invoice.update({ status: 'paid', subscriptionId: subscription.id });

      logger.info('Recurring payment processed', { invoiceId, subscriptionId: subscription.id });
      return { success: true, paymentId: payment.id, type: 'subscription' };
    } else {
      // One-time charge
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(invoice.amount * 100), // Cents
        currency: 'usd',
        payment_method: methodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: 'https://propertyai.com/success', // Stub
        idempotency_key: idempotencyKey,
      });

      payment = await Payment.create({
        invoiceId,
        tenantId: tenant.id,
        amount: invoice.amount,
        status: paymentIntent.status, // pending or succeeded
        stripeChargeId: paymentIntent.id,
      });

      if (paymentIntent.status === 'succeeded') {
        await invoice.update({ status: 'paid' });
      } else if (paymentIntent.status === 'requires_action') {
        await invoice.update({ status: 'pending' });
      }

      logger.info('One-time payment processed', { invoiceId, paymentIntentId: paymentIntent.id, status: paymentIntent.status });
      return { success: true, paymentId: payment.id, requiresAction: paymentIntent.status === 'requires_action' };
    }
  } catch (error) {
    if (error.type === 'StripeCardError') {
      logger.warn('Payment processing failed - card error', { invoiceId, error: error.message });
      const failedPayment = await Payment.create({
        invoiceId,
        tenantId: invoice.Tenant.id,
        amount: invoice.amount,
        status: 'failed',
        stripeChargeId: error.payment_intent?.id || null,
      });
      await invoice.update({ status: 'pending' }); // Retry possible
      throw new Error(`Payment failed: ${error.message}`); // Client 402
    }
    logger.error('Unexpected payment processing error', { invoiceId, error: error.message });
    throw new Error('Internal server error'); // Client 500
  }
};

const createCustomer = async (tenant) => {
  const customer = await stripe.customers.create({
    email: tenant.email,
    name: tenant.name,
  });
  await tenant.update({ stripeCustomerId: customer.id });
  return customer.id;
};

const createPrice = async (amount) => {
  const price = await stripe.prices.create({
    unit_amount: Math.round(amount * 100),
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: { name: 'Monthly Rent' },
  });
  return price.id;
};

module.exports = {
  setupPaymentMethod,
  processPayment,
  createCustomer,
  createPrice,
};