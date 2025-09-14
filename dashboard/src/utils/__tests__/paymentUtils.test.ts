import { paymentUtils } from '../paymentUtils';

// Mock fetch globally
global.fetch = jest.fn();

describe('PaymentUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      const result = paymentUtils.formatCurrency(1234.56, 'USD');
      expect(result).toBe('$1,234.56');
    });

    it('should format EUR currency correctly', () => {
      const result = paymentUtils.formatCurrency(1234.56, 'EUR');
      expect(result).toBe('€1,234.56');
    });

    it('should format GBP currency correctly', () => {
      const result = paymentUtils.formatCurrency(1234.56, 'GBP');
      expect(result).toBe('£1,234.56');
    });
  });

  describe('validatePaymentAmount', () => {
    it('should validate positive amounts', () => {
      expect(paymentUtils.validatePaymentAmount(100)).toBe(true);
      expect(paymentUtils.validatePaymentAmount(0.01)).toBe(true);
    });

    it('should reject zero or negative amounts', () => {
      expect(paymentUtils.validatePaymentAmount(0)).toBe(false);
      expect(paymentUtils.validatePaymentAmount(-100)).toBe(false);
    });

    it('should reject amounts over the limit', () => {
      expect(paymentUtils.validatePaymentAmount(1000001)).toBe(false);
    });
  });

  describe('validateCurrency', () => {
    it('should validate supported currencies', () => {
      expect(paymentUtils.validateCurrency('USD')).toBe(true);
      expect(paymentUtils.validateCurrency('EUR')).toBe(true);
      expect(paymentUtils.validateCurrency('GBP')).toBe(true);
      expect(paymentUtils.validateCurrency('CAD')).toBe(true);
      expect(paymentUtils.validateCurrency('AUD')).toBe(true);
    });

    it('should reject unsupported currencies', () => {
      expect(paymentUtils.validateCurrency('BTC')).toBe(false);
      expect(paymentUtils.validateCurrency('XYZ')).toBe(false);
    });
  });

  describe('processPayment', () => {
    const mockPaymentData = {
      tenantId: 'tenant_123',
      leaseId: 'lease_456',
      amount: 1000,
      currency: 'USD' as const,
      paymentMethodId: 'pm_789',
      description: 'Monthly rent',
    };

    it('should process payment successfully', async () => {
      const mockResponse = {
        id: 'txn_123',
        status: 'completed',
        amount: 1000,
        currency: 'USD',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await paymentUtils.processPayment(
        'stripe',
        1000,
        'USD',
        'pm_789',
        { description: 'Monthly rent' }
      );

      expect(global.fetch).toHaveBeenCalledWith('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processor: 'stripe',
          amount: 1000,
          currency: 'USD',
          paymentMethodId: 'pm_789',
          metadata: { description: 'Monthly rent' },
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle payment processing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Payment failed',
      });

      await expect(
        paymentUtils.processPayment('stripe', 1000, 'USD', 'pm_789')
      ).rejects.toThrow('Payment processing failed');
    });
  });

  describe('createRecurringPayment', () => {
    const mockRecurringData = {
      tenantId: 'tenant_123',
      leaseId: 'lease_456',
      paymentMethodId: 'pm_789',
      amount: 1000,
      currency: 'USD' as const,
      frequency: 'monthly' as const,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      description: 'Monthly rent payment',
    };

    it('should create recurring payment successfully', async () => {
      const mockResponse = {
        id: 'recurring_123',
        ...mockRecurringData,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await paymentUtils.createRecurringPayment(mockRecurringData);

      expect(global.fetch).toHaveBeenCalledWith('/api/payments/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRecurringData),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle recurring payment creation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Invalid payment method',
      });

      await expect(
        paymentUtils.createRecurringPayment(mockRecurringData)
      ).rejects.toThrow('Recurring payment setup failed');
    });
  });

  describe('createPaymentPlan', () => {
    const mockPlanData = {
      tenantId: 'tenant_123',
      leaseId: 'lease_456',
      totalAmount: 12000,
      currency: 'USD' as const,
      installments: 12,
      frequency: 'monthly' as const,
      startDate: '2024-01-01',
      description: 'Year-long payment plan',
    };

    it('should create payment plan successfully', async () => {
      const mockResponse = {
        id: 'plan_123',
        ...mockPlanData,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await paymentUtils.createPaymentPlan(mockPlanData);

      expect(global.fetch).toHaveBeenCalledWith('/api/payments/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPlanData),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const mockResponse = {
        id: 'refund_123',
        transactionId: 'txn_456',
        amount: 500,
        status: 'completed',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await paymentUtils.processRefund('txn_456', 500, 'Customer request');

      expect(global.fetch).toHaveBeenCalledWith('/api/payments/refund/txn_456', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500, reason: 'Customer request' }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should process full refund when no amount specified', async () => {
      const mockResponse = {
        id: 'refund_123',
        transactionId: 'txn_456',
        amount: 1000,
        status: 'completed',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await paymentUtils.processRefund('txn_456');

      expect(global.fetch).toHaveBeenCalledWith('/api/payments/refund/txn_456', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    });
  });

  describe('getPaymentHistory', () => {
    it('should fetch payment history successfully', async () => {
      const mockResponse = {
        transactions: [
          {
            id: 'txn_1',
            amount: 1000,
            currency: 'USD',
            status: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await paymentUtils.getPaymentHistory('tenant_123', {
        status: 'completed',
        limit: 10,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/payments/history/tenant_123?status=completed&limit=10&offset=0',
        undefined
      );

      expect(result).toEqual(mockResponse);
    });
  });
});