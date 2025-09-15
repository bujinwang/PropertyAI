const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');

// Mock services and models
jest.mock('../src/services/stripeService');
jest.mock('../src/models/Tenant');
jest.mock('../src/models/PaymentMethod');
jest.mock('../src/middleware/authMiddleware');
jest.mock('../src/config/database');

const stripeService = require('../src/services/stripeService');
const Tenant = require('../src/models/Tenant');
const PaymentMethod = require('../src/models/PaymentMethod');
const authMiddleware = require('../src/middleware/authMiddleware');

// Import the routes after mocking
const paymentsRoutes = require('../src/routes/payments');

describe('Payment Routes - Payment Method Management', () => {
  let app;
  let mockTenant;
  let mockPaymentMethod;
  let mockUser;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/payments', paymentsRoutes);

    // Mock user for authentication
    mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'tenant@example.com'
    };

    // Mock tenant
    mockTenant = {
      id: mockUser.id,
      stripeCustomerId: 'cus_mock123',
      name: 'John Doe',
      email: 'tenant@example.com',
      update: jest.fn().mockResolvedValue(true)
    };

    // Mock payment method
    mockPaymentMethod = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      tenantId: mockUser.id,
      stripePaymentMethodId: 'pm_mock123',
      type: 'card',
      cardBrand: 'visa',
      cardLast4: '4242',
      cardExpMonth: 12,
      cardExpYear: 2025,
      isDefault: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      getDisplayName: jest.fn().mockReturnValue('Visa **** 4242'),
      isExpired: jest.fn().mockReturnValue(false),
      getExpirationStatus: jest.fn().mockReturnValue('valid'),
      update: jest.fn().mockResolvedValue(true)
    };

    // Mock authentication middleware
    authMiddleware.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Mock Stripe service methods
    stripeService.attachPaymentMethod = jest.fn();
    stripeService.detachPaymentMethod = jest.fn();
  });

  describe('POST /api/payments/setup-payment-method', () => {
    const validPaymentMethodData = {
      paymentMethodId: 'pm_mock123',
      setAsDefault: false
    };

    it('should successfully attach and save a payment method', async () => {
      // Mock tenant lookup
      Tenant.findByPk.mockResolvedValue(mockTenant);

      // Mock Stripe service response
      const mockAttachedMethod = {
        id: 'pm_mock123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        },
        isDefault: false
      };
      stripeService.attachPaymentMethod.mockResolvedValue(mockAttachedMethod);

      // Mock PaymentMethod creation
      PaymentMethod.create.mockResolvedValue(mockPaymentMethod);

      const response = await request(app)
        .post('/api/payments/setup-payment-method')
        .send(validPaymentMethodData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment method added successfully');
      expect(response.body.paymentMethod).toBeDefined();
      expect(response.body.paymentMethod.displayName).toBe('Visa **** 4242');

      expect(Tenant.findByPk).toHaveBeenCalledWith(mockUser.id);
      expect(stripeService.attachPaymentMethod).toHaveBeenCalledWith(
        mockTenant.stripeCustomerId,
        validPaymentMethodData.paymentMethodId,
        validPaymentMethodData.setAsDefault
      );
      expect(PaymentMethod.create).toHaveBeenCalled();
    });

    it('should set payment method as default when requested', async () => {
      const dataWithDefault = { ...validPaymentMethodData, setAsDefault: true };
      const mockAttachedMethod = {
        id: 'pm_mock123',
        type: 'card',
        card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2025 },
        isDefault: true
      };

      Tenant.findByPk.mockResolvedValue(mockTenant);
      stripeService.attachPaymentMethod.mockResolvedValue(mockAttachedMethod);
      PaymentMethod.create.mockResolvedValue({ ...mockPaymentMethod, isDefault: true });

      const response = await request(app)
        .post('/api/payments/setup-payment-method')
        .send(dataWithDefault)
        .expect(201);

      expect(response.body.paymentMethod.isDefault).toBe(true);
      expect(stripeService.attachPaymentMethod).toHaveBeenCalledWith(
        mockTenant.stripeCustomerId,
        dataWithDefault.paymentMethodId,
        true
      );
    });

    it('should return 404 if tenant not found', async () => {
      Tenant.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/payments/setup-payment-method')
        .send(validPaymentMethodData)
        .expect(404);

      expect(response.body.error).toBe('Tenant not found');
      expect(stripeService.attachPaymentMethod).not.toHaveBeenCalled();
    });

    it('should return 400 if tenant has no Stripe customer', async () => {
      const tenantWithoutCustomer = { ...mockTenant, stripeCustomerId: null };
      Tenant.findByPk.mockResolvedValue(tenantWithoutCustomer);

      const response = await request(app)
        .post('/api/payments/setup-payment-method')
        .send(validPaymentMethodData)
        .expect(400);

      expect(response.body.error).toBe('Customer not found');
      expect(response.body.message).toContain('must have a Stripe customer account');
    });

    it('should handle Stripe service errors', async () => {
      Tenant.findByPk.mockResolvedValue(mockTenant);
      stripeService.attachPaymentMethod.mockRejectedValue(new Error('Stripe API error'));

      const response = await request(app)
        .post('/api/payments/setup-payment-method')
        .send(validPaymentMethodData)
        .expect(500);

      expect(response.body.error).toBe('Payment method setup failed');
      expect(response.body.message).toBe('Unable to add payment method');
    });

    it('should validate payment method ID format', async () => {
      const invalidData = { paymentMethodId: 'invalid_id' };

      const response = await request(app)
        .post('/api/payments/setup-payment-method')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Invalid payment method ID');
    });
  });

  describe('GET /api/payments/payment-methods', () => {
    it('should return list of payment methods for tenant', async () => {
      const mockPaymentMethods = [mockPaymentMethod];
      PaymentMethod.findAll.mockResolvedValue(mockPaymentMethods);

      const response = await request(app)
        .get('/api/payments/payment-methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.paymentMethods).toHaveLength(1);
      expect(response.body.count).toBe(1);
      expect(response.body.paymentMethods[0].displayName).toBe('Visa **** 4242');

      expect(PaymentMethod.findAll).toHaveBeenCalledWith({
        where: {
          tenantId: mockUser.id,
          isActive: true
        },
        order: [
          ['isDefault', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });
    });

    it('should return empty list when no payment methods exist', async () => {
      PaymentMethod.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/payments/payment-methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.paymentMethods).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should include card details for card payment methods', async () => {
      const cardMethod = { ...mockPaymentMethod };
      PaymentMethod.findAll.mockResolvedValue([cardMethod]);

      const response = await request(app)
        .get('/api/payments/payment-methods')
        .expect(200);

      expect(response.body.paymentMethods[0].card).toBeDefined();
      expect(response.body.paymentMethods[0].card.brand).toBe('visa');
      expect(response.body.paymentMethods[0].card.last4).toBe('4242');
    });

    it('should include bank details for bank account payment methods', async () => {
      const bankMethod = {
        ...mockPaymentMethod,
        type: 'us_bank_account',
        bankName: 'Test Bank',
        bankLast4: '1234',
        bankRoutingNumber: '123456789'
      };
      PaymentMethod.findAll.mockResolvedValue([bankMethod]);

      const response = await request(app)
        .get('/api/payments/payment-methods')
        .expect(200);

      expect(response.body.paymentMethods[0].bank).toBeDefined();
      expect(response.body.paymentMethods[0].bank.name).toBe('Test Bank');
      expect(response.body.paymentMethods[0].bank.last4).toBe('1234');
    });

    it('should handle database errors', async () => {
      PaymentMethod.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/payments/payment-methods')
        .expect(500);

      expect(response.body.error).toBe('Payment methods retrieval failed');
    });
  });

  describe('DELETE /api/payments/payment-methods/:id', () => {
    const paymentMethodId = '550e8400-e29b-41d4-a716-446655440001';

    it('should successfully remove a payment method', async () => {
      PaymentMethod.findOne.mockResolvedValue(mockPaymentMethod);
      stripeService.detachPaymentMethod.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/payments/payment-methods/${paymentMethodId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment method removed successfully');
      expect(response.body.paymentMethodId).toBe(paymentMethodId);

      expect(PaymentMethod.findOne).toHaveBeenCalledWith({
        where: {
          id: paymentMethodId,
          tenantId: mockUser.id,
          isActive: true
        }
      });
      expect(stripeService.detachPaymentMethod).toHaveBeenCalledWith(mockPaymentMethod.stripePaymentMethodId);
      expect(mockPaymentMethod.update).toHaveBeenCalledWith({
        isActive: false,
        updatedBy: mockUser.id
      });
    });

    it('should return 404 if payment method not found', async () => {
      PaymentMethod.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/payments/payment-methods/${paymentMethodId}`)
        .expect(404);

      expect(response.body.error).toBe('Payment method not found');
      expect(stripeService.detachPaymentMethod).not.toHaveBeenCalled();
    });

    it('should validate payment method ID format', async () => {
      const invalidId = 'invalid-uuid';

      const response = await request(app)
        .delete(`/api/payments/payment-methods/${invalidId}`)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Invalid payment method ID format');
    });

    it('should handle Stripe detachment errors', async () => {
      PaymentMethod.findOne.mockResolvedValue(mockPaymentMethod);
      stripeService.detachPaymentMethod.mockRejectedValue(new Error('Stripe error'));

      const response = await request(app)
        .delete(`/api/payments/payment-methods/${paymentMethodId}`)
        .expect(500);

      expect(response.body.error).toBe('Payment method removal failed');
    });
  });

  describe('PUT /api/payments/payment-methods/:id/default', () => {
    const paymentMethodId = '550e8400-e29b-41d4-a716-446655440001';

    it('should successfully set payment method as default', async () => {
      PaymentMethod.findOne.mockResolvedValue(mockPaymentMethod);
      PaymentMethod.update.mockResolvedValue([1]); // Mock successful update

      const response = await request(app)
        .put(`/api/payments/payment-methods/${paymentMethodId}/default`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Default payment method updated successfully');
      expect(response.body.paymentMethodId).toBe(paymentMethodId);

      expect(PaymentMethod.update).toHaveBeenCalledWith(
        { isDefault: false },
        {
          where: { tenantId: mockUser.id, isDefault: true },
          transaction: expect.any(Object)
        }
      );
      expect(mockPaymentMethod.update).toHaveBeenCalledWith(
        { isDefault: true, updatedBy: mockUser.id },
        { transaction: expect.any(Object) }
      );
    });

    it('should return 404 if payment method not found', async () => {
      PaymentMethod.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/payments/payment-methods/${paymentMethodId}/default`)
        .expect(404);

      expect(response.body.error).toBe('Payment method not found');
    });

    it('should validate payment method ID format', async () => {
      const invalidId = 'invalid-uuid';

      const response = await request(app)
        .put(`/api/payments/payment-methods/${invalidId}/default`)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Invalid payment method ID format');
    });

    it('should handle transaction rollback on error', async () => {
      PaymentMethod.findOne.mockResolvedValue(mockPaymentMethod);
      PaymentMethod.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put(`/api/payments/payment-methods/${paymentMethodId}/default`)
        .expect(500);

      expect(response.body.error).toBe('Default payment method update failed');
    });
  });
});