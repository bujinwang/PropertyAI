const paymentService = require('../src/services/paymentService');
const nock = require('nock');
const stripe = require('stripe')('sk_test_mock');
const Tenant = require('../src/models/Tenant'); // Mock if needed

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

      const tenant = { id: 't_123', paymentMethods: { cards: [] }, save: jest.fn() };
      Tenant.findByPk = jest.fn().mockResolvedValue(tenant);

      const result = await paymentService.setupPaymentMethod('card', { token: 'tok_456' }, 't_123');

      expect(result).toEqual({ success: true, methodId: 'pm_123' });
      expect(tenant.paymentMethods.cards).toContain('pm_123');
      expect(tenant.save).toHaveBeenCalled();
    });

    it('should create ACH payment method and update tenant', async () => {
      const mockMethod = { id: 'pm_789' };
      nock('https://api.stripe.com')
        .post('/v1/payment_methods')
        .reply(200, mockMethod);

      const tenant = { id: 't_123', paymentMethods: { ach: null }, save: jest.fn() };
      Tenant.findByPk = jest.fn().mockResolvedValue(tenant);

      const result = await paymentService.setupPaymentMethod('ach', { routingNumber: '110000000', accountNumber: '000123456789' }, 't_123');

      expect(result).toEqual({ success: true, methodId: 'pm_789' });
      expect(tenant.paymentMethods.ach).toBe('pm_789');
      expect(tenant.save).toHaveBeenCalled();
    });

    it('should handle invalid type error', async () => {
      await expect(paymentService.setupPaymentMethod('invalid', {}, 't_123')).rejects.toThrow('Invalid payment type');
    });

    it('should handle Stripe card error', async () => {
      nock('https://api.stripe.com')
        .post('/v1/payment_methods')
        .reply(400, {}, { error: { type: 'StripeCardError', message: 'Card declined' } });

      const tenant = { id: 't_123' };
      Tenant.findByPk = jest.fn().mockResolvedValue(tenant);

      await expect(paymentService.setupPaymentMethod('card', { token: 'tok_bad' }, 't_123')).rejects.toThrow('Payment setup failed: Card declined');
    });

    it('should handle tenant not found', async () => {
      Tenant.findByPk = jest.fn().mockResolvedValue(null);

      await expect(paymentService.setupPaymentMethod('card', { token: 'tok_456' }, 't_unknown')).rejects.toThrow('Tenant not found');
    });

    it('should log success and errors appropriately', async () => {
      const mockMethod = { id: 'pm_log' };
      nock('https://api.stripe.com')
        .post('/v1/payment_methods')
        .reply(200, mockMethod);

      const tenant = { id: 't_log', paymentMethods: { cards: [] }, save: jest.fn() };
      Tenant.findByPk = jest.fn().mockResolvedValue(tenant);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await paymentService.setupPaymentMethod('card', { token: 'tok_log' }, 't_log');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Payment method setup successful'));
      consoleSpy.mockRestore();
    });
  });
});