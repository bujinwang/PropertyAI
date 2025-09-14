const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = stripe;
    this.apiVersion = '2024-06-20'; // Latest stable API version
  }

  /**
   * Create a Stripe customer
   * @param {Object} customerData - Customer information
   * @param {string} customerData.email - Customer email
   * @param {string} customerData.name - Customer name
   * @param {string} customerData.phone - Customer phone (optional)
   * @param {Object} customerData.metadata - Additional metadata
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(customerData) {
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: {
          tenantId: customerData.tenantId,
          propertyId: customerData.propertyId,
          ...customerData.metadata
        }
      });

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created
      };
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Retrieve a Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Stripe customer object
   */
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata,
        created: customer.created
      };
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      throw new Error(`Failed to retrieve customer: ${error.message}`);
    }
  }

  /**
   * Update a Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated customer object
   */
  async updateCustomer(customerId, updateData) {
    try {
      const customer = await this.stripe.customers.update(customerId, updateData);
      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata
      };
    } catch (error) {
      console.error('Error updating Stripe customer:', error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * Delete a Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteCustomer(customerId) {
    try {
      const deleted = await this.stripe.customers.del(customerId);
      return {
        id: deleted.id,
        deleted: deleted.deleted
      };
    } catch (error) {
      console.error('Error deleting Stripe customer:', error);
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Create a setup intent for collecting payment method
   * @param {string} customerId - Stripe customer ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Setup intent object
   */
  async createSetupIntent(customerId, options = {}) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card', 'us_bank_account'],
        usage: 'off_session', // For future payments
        metadata: {
          purpose: 'payment_method_setup',
          ...options.metadata
        }
      });

      return {
        id: setupIntent.id,
        client_secret: setupIntent.client_secret,
        status: setupIntent.status,
        customer: setupIntent.customer
      };
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }

  /**
   * Attach a payment method to a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} paymentMethodId - Stripe payment method ID
   * @param {boolean} setAsDefault - Whether to set as default payment method
   * @returns {Promise<Object>} Payment method attachment result
   */
  async attachPaymentMethod(customerId, paymentMethodId, setAsDefault = false) {
    try {
      // Attach payment method to customer
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default if requested
      if (setAsDefault) {
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        } : null,
        us_bank_account: paymentMethod.us_bank_account ? {
          bank_name: paymentMethod.us_bank_account.bank_name,
          last4: paymentMethod.us_bank_account.last4,
          routing_number: paymentMethod.us_bank_account.routing_number
        } : null,
        isDefault: setAsDefault
      };
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw new Error(`Failed to attach payment method: ${error.message}`);
    }
  }

  /**
   * List payment methods for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} type - Payment method type (card, us_bank_account)
   * @returns {Promise<Array>} List of payment methods
   */
  async listPaymentMethods(customerId, type = 'card') {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year
        } : null,
        us_bank_account: pm.us_bank_account ? {
          bank_name: pm.us_bank_account.bank_name,
          last4: pm.us_bank_account.last4,
          routing_number: pm.us_bank_account.routing_number
        } : null,
        created: pm.created
      }));
    } catch (error) {
      console.error('Error listing payment methods:', error);
      throw new Error(`Failed to list payment methods: ${error.message}`);
    }
  }

  /**
   * Detach a payment method from a customer
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {Promise<Object>} Detachment result
   */
  async detachPaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      return {
        id: paymentMethod.id,
        detached: true
      };
    } catch (error) {
      console.error('Error detaching payment method:', error);
      throw new Error(`Failed to detach payment method: ${error.message}`);
    }
  }

  /**
   * Create a payment intent for immediate payment
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Amount in cents
   * @param {string} paymentData.currency - Currency code
   * @param {string} paymentData.customerId - Stripe customer ID
   * @param {string} paymentData.paymentMethodId - Payment method ID
   * @param {Object} paymentData.metadata - Additional metadata
   * @returns {Promise<Object>} Payment intent object
   */
  async createPaymentIntent(paymentData) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        customer: paymentData.customerId,
        payment_method: paymentData.paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          invoiceId: paymentData.invoiceId,
          tenantId: paymentData.tenantId,
          ...paymentData.metadata
        }
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        client_secret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Payment intent object
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {string} rawBody - Raw request body
   * @param {string} signature - Stripe signature header
   * @param {string} webhookSecret - Webhook endpoint secret
   * @returns {Promise<Object>} Webhook event object
   */
  async constructWebhookEvent(rawBody, signature, webhookSecret) {
    try {
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      return event;
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}

module.exports = new StripeService();