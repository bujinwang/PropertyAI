const paymentService = require('../src/services/paymentService');
const nock = require('nock');
const stripe = require('stripe')('sk_test_mock');

// Mock Prisma client
jest.mock('../src/config/database', () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../src/config/database');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupPaymentMethod', () => {
    it('should create card payment method and update tenant', async () => {
      const mockMethod = { id: 'pm_123' };
      nock('https://api.stripe.com')
        .post('/v1/payment_methods')
        .reply(200, mockMethod);

      const tenant = {
        id: 't_123',
        paymentMethods: { cards: [] }
      };
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      prisma.tenant.update.mockResolvedValue({
        ...tenant,
        paymentMethods: { cards: ['pm_123'] }
      });

      const result = await paymentService.setupPaymentMethod('card', { token: 'tok_456' }, 't_123');

      expect(result).toEqual({ success: true, methodId: 'pm_123' });
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 't_123' },
        data: {
          paymentMethods: { cards: ['pm_123'] }
        }
      });
    });

    it('should create ACH payment method and update tenant', async () => {
      const mockMethod = { id: 'pm_789' };
      nock('https://api.stripe.com')
        .post('/v1/payment_methods')
        .reply(200, mockMethod);

      const tenant = {
        id: 't_123',
        paymentMethods: { ach: null }
      };
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      prisma.tenant.update.mockResolvedValue({
        ...tenant,
        paymentMethods: { ach: 'pm_789' }
      });

      const result = await paymentService.setupPaymentMethod('ach', { routingNumber: '110000000', accountNumber: '000123456789' }, 't_123');

      expect(result).toEqual({ success: true, methodId: 'pm_789' });
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 't_123' },
        data: {
          paymentMethods: { ach: 'pm_789' }
        }
      });
    });

    it('should handle invalid type error', async () => {
      await expect(paymentService.setupPaymentMethod('invalid', {}, 't_123')).rejects.toThrow('Invalid payment type');
    });

    it('should handle Stripe card error', async () => {
      nock('https://api.stripe.com')
        .post('/v1/payment_methods')
        .reply(400, {}, { error: { type: 'StripeCardError', message: 'Card declined' } });

      const tenant = { id: 't_123' };
      prisma.tenant.findUnique.mockResolvedValue(tenant);

      await expect(paymentService.setupPaymentMethod('card', { token: 'tok_bad' }, 't_123')).rejects.toThrow('Payment setup failed: Card declined');
    });

    it('should handle tenant not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(paymentService.setupPaymentMethod('card', { token: 'tok_456' }, 't_unknown')).rejects.toThrow('Tenant not found');
    });

    it('should log success and errors appropriately', async () => {
      const mockMethod = { id: 'pm_log' };
      nock('https://api.stripe.com')
        .post('/v1/payment_methods')
        .reply(200, mockMethod);

      const tenant = {
        id: 't_log',
        paymentMethods: { cards: [] }
      };
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      prisma.tenant.update.mockResolvedValue({
        ...tenant,
        paymentMethods: { cards: ['pm_log'] }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await paymentService.setupPaymentMethod('card', { token: 'tok_log' }, 't_log');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Payment method setup successful'));
      consoleSpy.mockRestore();
    });
  });
});