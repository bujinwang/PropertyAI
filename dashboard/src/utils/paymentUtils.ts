import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

// Payment processor types
export type PaymentProcessor = 'stripe' | 'paypal' | 'ach';

// Payment method types
export type PaymentMethodType = 'card' | 'bank_account' | 'paypal';

// Currency support
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

// Payment status
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// Interfaces
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  processor: PaymentProcessor;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountType?: 'checking' | 'savings';
  isDefault: boolean;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  paymentMethodId?: string;
  processorPaymentId?: string;
  clientSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentIntentId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  processor: PaymentProcessor;
  processorTransactionId: string;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
  fees?: number;
  netAmount?: number;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringPayment {
  id: string;
  tenantId: string;
  leaseId: string;
  paymentMethodId: string;
  amount: number;
  currency: Currency;
  frequency: 'monthly' | 'quarterly' | 'annually';
  nextPaymentDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPlan {
  id: string;
  tenantId: string;
  leaseId: string;
  totalAmount: number;
  currency: Currency;
  installments: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'defaulted';
  payments: PaymentTransaction[];
  createdAt: string;
  updatedAt: string;
}

// Stripe utilities
class StripePaymentUtils {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  async initialize(publicKey: string): Promise<void> {
    this.stripe = await loadStripe(publicKey);
  }

  async createPaymentMethod(cardElement: StripeCardElement, billingDetails?: any): Promise<any> {
    if (!this.stripe) throw new Error('Stripe not initialized');

    const { error, paymentMethod } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: billingDetails,
    });

    if (error) throw error;
    return paymentMethod;
  }

  async confirmCardPayment(clientSecret: string, paymentMethodId?: string): Promise<any> {
    if (!this.stripe) throw new Error('Stripe not initialized');

    const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });

    if (error) throw error;
    return paymentIntent;
  }

  async createSetupIntent(): Promise<any> {
    // This would typically call your backend API
    const response = await fetch('/api/payments/stripe/setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  }
}

// PayPal utilities
class PayPalPaymentUtils {
  private scriptLoaded = false;

  async initialize(clientId: string): Promise<void> {
    if (this.scriptLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  createOrder(amount: number, currency: Currency = 'USD'): any {
    return {
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      }],
    };
  }

  async processPayPalPayment(orderId: string): Promise<any> {
    const response = await fetch('/api/payments/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    return response.json();
  }
}

// ACH utilities
class ACHPaymentUtils {
  async createBankAccountToken(routingNumber: string, accountNumber: string, accountType: 'checking' | 'savings'): Promise<any> {
    // This would integrate with a service like Stripe or Plaid for ACH
    const response = await fetch('/api/payments/ach/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routingNumber,
        accountNumber,
        accountType,
      }),
    });
    return response.json();
  }

  async verifyMicroDeposits(bankAccountId: string, amounts: [number, number]): Promise<any> {
    const response = await fetch(`/api/payments/ach/verify/${bankAccountId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amounts }),
    });
    return response.json();
  }
}

// Main payment utilities class
export class PaymentUtils {
  private stripeUtils = new StripePaymentUtils();
  private paypalUtils = new PayPalPaymentUtils();
  private achUtils = new ACHPaymentUtils();

  // Initialize all payment processors
  async initializePaymentProcessors(config: {
    stripePublicKey?: string;
    paypalClientId?: string;
  }): Promise<void> {
    const promises = [];

    if (config.stripePublicKey) {
      promises.push(this.stripeUtils.initialize(config.stripePublicKey));
    }

    if (config.paypalClientId) {
      promises.push(this.paypalUtils.initialize(config.paypalClientId));
    }

    await Promise.all(promises);
  }

  // Payment method management
  async createPaymentMethod(processor: PaymentProcessor, data: any): Promise<PaymentMethod> {
    switch (processor) {
      case 'stripe':
        return this.stripeUtils.createPaymentMethod(data.cardElement, data.billingDetails);
      case 'paypal':
        // PayPal payment methods are handled differently
        throw new Error('PayPal payment method creation not implemented');
      case 'ach':
        return this.achUtils.createBankAccountToken(
          data.routingNumber,
          data.accountNumber,
          data.accountType
        );
      default:
        throw new Error(`Unsupported payment processor: ${processor}`);
    }
  }

  // Payment processing
  async processPayment(
    processor: PaymentProcessor,
    amount: number,
    currency: Currency,
    paymentMethodId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentTransaction> {
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        processor,
        amount,
        currency,
        paymentMethodId,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Payment processing failed');
    }

    return response.json();
  }

  // Recurring payment setup
  async createRecurringPayment(data: {
    tenantId: string;
    leaseId: string;
    paymentMethodId: string;
    amount: number;
    currency: Currency;
    frequency: 'monthly' | 'quarterly' | 'annually';
    startDate: string;
    endDate?: string;
  }): Promise<RecurringPayment> {
    const response = await fetch('/api/payments/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Recurring payment setup failed');
    }

    return response.json();
  }

  // Payment plan creation
  async createPaymentPlan(data: {
    tenantId: string;
    leaseId: string;
    totalAmount: number;
    currency: Currency;
    installments: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    startDate: string;
  }): Promise<PaymentPlan> {
    const response = await fetch('/api/payments/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Payment plan creation failed');
    }

    return response.json();
  }

  // Refund processing
  async processRefund(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentTransaction> {
    const response = await fetch(`/api/payments/refund/${transactionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, reason }),
    });

    if (!response.ok) {
      throw new Error('Refund processing failed');
    }

    return response.json();
  }

  // Get payment methods for a tenant
  async getPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    const response = await fetch(`/api/payments/methods/${tenantId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch payment methods');
    }

    return response.json();
  }

  // Get payment history
  async getPaymentHistory(
    tenantId: string,
    filters?: {
      status?: PaymentStatus;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ transactions: PaymentTransaction[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`/api/vendor-payments/history/${tenantId}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    return response.json();
  }

  // Utility methods
  formatCurrency(amount: number, currency: Currency): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  validatePaymentAmount(amount: number): boolean {
    return amount > 0 && amount <= 1000000; // Max $10M
  }

  validateCurrency(currency: string): currency is Currency {
    return ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(currency);
  }
}

// Export singleton instance
export const paymentUtils = new PaymentUtils();