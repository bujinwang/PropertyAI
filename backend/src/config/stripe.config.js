/**
 * Stripe Configuration
 * Configuration for Stripe payment processing
 */

require('dotenv').config();

const stripeConfig = {
  // Stripe API Keys
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,

  // Webhook Configuration
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // API Version
  apiVersion: '2023-10-16',

  // Default Settings
  defaultCurrency: 'usd',

  // Product/Price IDs (configure these in your Stripe dashboard)
  products: {
    basic: process.env.STRIPE_PRODUCT_BASIC || 'prod_basic_plan',
    premium: process.env.STRIPE_PRODUCT_PREMIUM || 'prod_premium_plan',
    enterprise: process.env.STRIPE_PRODUCT_ENTERPRISE || 'prod_enterprise_plan'
  },

  prices: {
    basic: process.env.STRIPE_PRICE_BASIC || 'price_basic_monthly',
    premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_monthly',
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly'
  },

  // Payment Settings
  paymentMethods: {
    types: ['card'],
    setupFutureUsage: 'off_session'
  },

  // Invoice Settings
  invoice: {
    autoAdvance: true,
    daysUntilDue: 30,
    collectionMethod: 'charge_automatically'
  },

  // Subscription Settings
  subscription: {
    defaultPaymentMethod: true,
    enableIncompletePayments: true,
    prorationBehavior: 'create_prorations'
  },

  // Tax Settings
  tax: {
    automaticTax: true,
    taxRates: []
  },

  // Retry Settings for Failed Payments
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    backoffMultiplier: 2
  },

  // Event Types to Handle
  events: {
    paymentIntent: [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.canceled'
    ],
    invoice: [
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'invoice.finalized'
    ],
    subscription: [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ],
    customer: [
      'customer.created',
      'customer.updated',
      'customer.deleted'
    ]
  }
};

// Validation
const validateConfig = () => {
  const required = ['secretKey', 'webhookSecret'];

  for (const key of required) {
    if (!stripeConfig[key]) {
      throw new Error(`Missing required Stripe configuration: ${key}. Please set STRIPE_${key.toUpperCase()} in your environment variables.`);
    }
  }

  // Validate API key format
  if (!stripeConfig.secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format. Secret keys should start with "sk_"');
  }

  if (stripeConfig.publishableKey && !stripeConfig.publishableKey.startsWith('pk_')) {
    throw new Error('Invalid Stripe publishable key format. Publishable keys should start with "pk_"');
  }

  console.log('✅ Stripe configuration validated successfully');
};

// Initialize Stripe client
let stripe = null;

const getStripeClient = () => {
  if (!stripe) {
    const Stripe = require('stripe');
    stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: stripeConfig.apiVersion
    });
  }
  return stripe;
};

module.exports = {
  stripeConfig,
  validateConfig,
  getStripeClient
};