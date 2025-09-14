const stripeService = require('../src/services/stripeService');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      del: jest.fn()
    },
    setupIntents: {
      create: jest.fn()
    },
    paymentMethods: {
      attach: jest.fn(),
      list: jest.fn(),
      detach: jest.fn()
    },
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  }));
});

describe('StripeService', () => {
  let mockStripe;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get the mocked stripe instance
    mockStripe = require('stripe')();

    // Set up environment variable
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe('initialization', () => {
    it('should throw error if STRIPE_SECRET_KEY is not set', () => {
      delete process.env.STRIPE_SECRET_KEY;

      expect(() => {
        // Force re-require to trigger constructor
        delete require.cache[require.resolve('../src/services/stripeService')];
        require('../src/services/stripeService');
      }).toThrow('STRIPE_SECRET_KEY environment variable is required');
    });

    it('should initialize successfully with valid key', () => {
      expect(() => {
        require('../src/services/stripeService');
      }).not.toThrow();
    });
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_mock123',
        email: 'test@example.com',
        name: 'Test User',
        created: 1234567890
      };

      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const result = await stripeService.createCustomer({
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant123'
      });

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        phone: undefined,
        metadata: {
          tenantId: 'tenant123',
          propertyId: undefined
        }
      });

      expect(result).toEqual({
        id: 'cus_mock123',
        email: 'test@example.com',
        name: 'Test User',
        created: 1234567890
      });
    });

    it('should handle Stripe API errors', async () => {
      mockStripe.customers.create.mockRejectedValue(new Error('Invalid API key'));

      await expect(stripeService.createCustomer({
        email: 'test@example.com',
        name: 'Test User'
      })).rejects.toThrow('Failed to create customer: Invalid API key');
    });
  });

  describe('getCustomer', () => {
    it('should retrieve a customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_mock123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        metadata: { tenantId: 'tenant123' },
        created: 1234567890,
        deleted: false
      };

      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

      const result = await stripeService.getCustomer('cus_mock123');

      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_mock123');
      expect(result.id).toBe('cus_mock123');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error for deleted customer', async () => {
      const mockCustomer = {
        id: 'cus_mock123',
        deleted: true
      };

      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

      await expect(stripeService.getCustomer('cus_mock123'))
        .rejects.toThrow('Customer has been deleted');
    });
  });

  describe('createSetupIntent', () => {
    it('should create setup intent successfully', async () => {
      const mockSetupIntent = {
        id: 'seti_mock123',
        client_secret: 'seti_mock123_secret',
        status: 'requires_payment_method',
        customer: 'cus_mock123'
      };

      mockStripe.setupIntents.create.mockResolvedValue(mockSetupIntent);

      const result = await stripeService.createSetupIntent('cus_mock123');

      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: 'cus_mock123',
        payment_method_types: ['card', 'us_bank_account'],
        usage: 'off_session',
        metadata: {
          purpose: 'payment_method_setup'
        }
      });

      expect(result).toEqual({
        id: 'seti_mock123',
        client_secret: 'seti_mock123_secret',
        status: 'requires_payment_method',
        customer: 'cus_mock123'
      });
    });
  });

  describe('attachPaymentMethod', () => {
    it('should attach payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 'pm_mock123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        }
      };

      mockStripe.paymentMethods.attach.mockResolvedValue(mockPaymentMethod);
      mockStripe.customers.update.mockResolvedValue({});

      const result = await stripeService.attachPaymentMethod('cus_mock123', 'pm_mock123', true);

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_mock123', {
        customer: 'cus_mock123'
      });

      expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_mock123', {
        invoice_settings: {
          default_payment_method: 'pm_mock123'
        }
      });

      expect(result.id).toBe('pm_mock123');
      expect(result.type).toBe('card');
      expect(result.isDefault).toBe(true);
    });
  });

  describe('listPaymentMethods', () => {
    it('should list payment methods successfully', async () => {
      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_card123',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025
            },
            created: 1234567890
          },
          {
            id: 'pm_bank123',
            type: 'us_bank_account',
            us_bank_account: {
              bank_name: 'Test Bank',
              last4: '1234',
              routing_number: '123456789'
            },
            created: 1234567891
          }
        ]
      };

      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const result = await stripeService.listPaymentMethods('cus_mock123', 'card');

      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: 'cus_mock123',
        type: 'card'
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('pm_card123');
      expect(result[0].card.brand).toBe('visa');
      expect(result[1].us_bank_account.bank_name).toBe('Test Bank');
    });
  });

  describe('detachPaymentMethod', () => {
    it('should detach payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 'pm_mock123'
      };

      mockStripe.paymentMethods.detach.mockResolvedValue(mockPaymentMethod);

      const result = await stripeService.detachPaymentMethod('pm_mock123');

      expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith('pm_mock123');
      expect(result.id).toBe('pm_mock123');
      expect(result.detached).toBe(true);
    });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_mock123',
        status: 'succeeded',
        amount: 50000,
        currency: 'usd',
        client_secret: 'pi_mock123_secret'
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createPaymentIntent({
        amount: 50000,
        currency: 'usd',
        customerId: 'cus_mock123',
        paymentMethodId: 'pm_mock123',
        invoiceId: 'inv_123'
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'usd',
        customer: 'cus_mock123',
        payment_method: 'pm_mock123',
        off_session: true,
        confirm: true,
        metadata: {
          invoiceId: 'inv_123',
          tenantId: undefined
        }
      });

      expect(result.status).toBe('succeeded');
      expect(result.amount).toBe(50000);
    });
  });

  describe('constructWebhookEvent', () => {
    it('should construct webhook event successfully', async () => {
      const mockEvent = {
        id: 'evt_mock123',
        type: 'payment_intent.succeeded',
        data: { object: {} }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await stripeService.constructWebhookEvent(
        '{"type":"payment_intent.succeeded"}',
        'signature',
        'webhook_secret'
      );

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        '{"type":"payment_intent.succeeded"}',
        'signature',
        'webhook_secret'
      );

      expect(result.id).toBe('evt_mock123');
    });

    it('should handle webhook signature verification errors', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(stripeService.constructWebhookEvent(
        '{"type":"test"}',
        'invalid_signature',
        'webhook_secret'
      )).rejects.toThrow('Webhook signature verification failed: Invalid signature');
    });
  });
});