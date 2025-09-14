// Stripe configuration for test mode
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_default', {
  apiVersion: '2024-04-10',
  // Enable test mode by default
  stripeAccount: undefined, // For connected accounts if needed later
});

module.exports = {
  stripe,
  isTestMode: process.env.NODE_ENV !== 'production',
};