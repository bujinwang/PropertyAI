const request = require('supertest');
const express = require('express');
const paymentsRouter = require('../src/routes/payments');
const stripeService = require('../src/services/stripeService');
const Tenant = require('../src/models/Tenant');

// Mock dependencies
jest.mock('../src/services/stripeService');
jest.mock('../src/models/Tenant');
jest.mock('../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'test-tenant-id', role: 'tenant' };
  next();
});
jest.mock('../src/middleware/errorMiddleware', () => ({
  handleAsyncError: (fn) => fn,
  handleValidationErrors: (req, res, next) => next()
}));

describe('Payments Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with payments router
    app = express();
    app.use(express.json());
    app.use('/api/payments', paymentsRouter);
  });

  describe('POST /api/payments/setup-customer', () => {
    const validCustomerData = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890'
    };

    it('should create a new Stripe customer successfully', async () => {
      // Mock tenant lookup
      Tenant.findByPk.mockResolvedValue({
        id: 'test-tenant-id',
        stripeCustomerId: null,
        propertyId: 'test-property-id',
        update: jest.fn().mockResolvedValue(true)
      });

      // Mock Stripe service
      stripeService.createCustomer.mockResolvedValue({
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test User',
        created: 1234567890
      });

      const response = await request(app)
        .post('/api/payments/setup-customer')
        .send(validCustomerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.customer.id).toBe('cus_test123');
      expect(stripeService.createCustomer).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        tenantId: 'test-tenant-id',
        propertyId: 'test-property-id',
        metadata: {
          tenantId: 'test-tenant-id',
          createdVia: 'api'
        }
      });
    });

    it('should return 409 if tenant already has Stripe customer', async () => {
      Tenant.findByPk.mockResolvedValue({
        id: 'test-tenant-id',
        stripeCustomerId: 'cus_existing123'
      });

      const response = await request(app)
        .post('/api/payments/setup-customer')
        .send(validCustomerData)
        .expect(409);

      expect(response.body.error).toBe('Customer already exists');
      expect(stripeService.createCustomer).not.toHaveBeenCalled();
    });

    it('should return 404 if tenant not found', async () => {
      Tenant.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/payments/setup-customer')
        .send(validCustomerData)
        .expect(404);

      expect(response.body.error).toBe('Tenant not found');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/payments/setup-customer')
        .send({ ...validCustomerData, email: 'invalid-email' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle Stripe API errors', async () => {
      Tenant.findByPk.mockResolvedValue({
        id: 'test-tenant-id',
        stripeCustomerId: null,
        update: jest.fn()
      });

      stripeService.createCustomer.mockRejectedValue(new Error('Stripe API error'));

      const response = await request(app)
        .post('/api/payments/setup-customer')
        .send(validCustomerData)
        .expect(500);

      expect(response.body.error).toBe('Customer creation failed');
    });
  });

  describe('GET /api/payments/customer', () => {
    it('should retrieve customer information successfully', async () => {
      Tenant.findByPk.mockResolvedValue({
        id: 'test-tenant-id',
        stripeCustomerId: 'cus_test123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890'
      });

      stripeService.getCustomer.mockResolvedValue({
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        metadata: { tenantId: 'test-tenant-id' },
        created: 1234567890
      });

      const response = await request(app)
        .get('/api/payments/customer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.customer.id).toBe('cus_test123');
      expect(response.body.customer.tenantId).toBe('test-tenant-id');
    });

    it('should return 404 if tenant has no Stripe customer', async () => {
      Tenant.findByPk.mockResolvedValue({
        id: 'test-tenant-id',
        stripeCustomerId: null
      });

      const response = await request(app)
        .get('/api/payments/customer')
        .expect(404);

      expect(response.body.error).toBe('Customer not found');
    });

    it('should handle deleted Stripe customers', async () => {
      const mockTenant = {
        id: 'test-tenant-id',
        stripeCustomerId: 'cus_deleted123',
        update: jest.fn().mockResolvedValue(true)
      };

      Tenant.findByPk.mockResolvedValue(mockTenant);
      stripeService.getCustomer.mockRejectedValue(new Error('Customer has been deleted'));

      const response = await request(app)
        .get('/api/payments/customer')
        .expect(404);

      expect(response.body.error).toBe('Customer not found');
      expect(mockTenant.update).toHaveBeenCalledWith({ stripeCustomerId: null });
    });
  });

  describe('PUT /api/payments/customer', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    it('should update customer information successfully', async () => {
      const mockTenant = {
        id: 'test-tenant-id',
        stripeCustomerId: 'cus_test123',
        update: jest.fn().mockResolvedValue(true)
      };

      Tenant.findByPk.mockResolvedValue(mockTenant);
      stripeService.updateCustomer.mockResolvedValue({
        id: 'cus_test123',
        name: 'Updated Name',
        email: 'updated@example.com'
      });

      const response = await request(app)
        .put('/api/payments/customer')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(stripeService.updateCustomer).toHaveBeenCalledWith('cus_test123', updateData);
      expect(mockTenant.update).toHaveBeenCalledWith(updateData);
    });

    it('should handle partial updates', async () => {
      const mockTenant = {
        id: 'test-tenant-id',
        stripeCustomerId: 'cus_test123',
        update: jest.fn().mockResolvedValue(true)
      };

      Tenant.findByPk.mockResolvedValue(mockTenant);
      stripeService.updateCustomer.mockResolvedValue({
        id: 'cus_test123',
        name: 'Updated Name'
      });

      const response = await request(app)
        .put('/api/payments/customer')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(mockTenant.update).toHaveBeenCalledWith({ name: 'Updated Name' });
    });
  });

  describe('DELETE /api/payments/customer', () => {
    it('should delete customer successfully', async () => {
      const mockTenant = {
        id: 'test-tenant-id',
        stripeCustomerId: 'cus_test123',
        update: jest.fn().mockResolvedValue(true)
      };

      Tenant.findByPk.mockResolvedValue(mockTenant);
      stripeService.deleteCustomer.mockResolvedValue({
        id: 'cus_test123',
        deleted: true
      });

      const response = await request(app)
        .delete('/api/payments/customer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTenant.update).toHaveBeenCalledWith({ stripeCustomerId: null });
    });

    it('should return 404 if tenant has no Stripe customer', async () => {
      Tenant.findByPk.mockResolvedValue({
        id: 'test-tenant-id',
        stripeCustomerId: null
      });

      const response = await request(app)
        .delete('/api/payments/customer')
        .expect(404);

      expect(response.body.error).toBe('Customer not found');
      expect(stripeService.deleteCustomer).not.toHaveBeenCalled();
    });
  });
});