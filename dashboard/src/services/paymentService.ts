// Payment types are defined inline for now

export interface PaymentMethodResponse {
  id: string;
  stripeId: string;
  type: 'card' | 'us_bank_account';
  displayName: string;
  isDefault: boolean;
  isExpired: boolean;
  expirationStatus: 'valid' | 'expiring_soon' | 'expired';
  created: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  bank?: {
    name: string;
    last4: string;
    routingNumber: string;
  };
}

export interface SetupPaymentMethodRequest {
  paymentMethodId: string;
  setAsDefault?: boolean;
}

export interface SetupPaymentMethodResponse {
  success: boolean;
  message: string;
  paymentMethod: {
    id: string;
    type: string;
    displayName: string;
    isDefault: boolean;
    created: string;
  };
}

export interface CustomerResponse {
  success: boolean;
  customer: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    created: string;
    defaultPaymentMethod?: string;
  };
}

class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Setup Stripe customer for the authenticated tenant
   */
  async setupCustomer(customerData: {
    email: string;
    name: string;
    phone?: string;
  }): Promise<CustomerResponse> {
    const response = await fetch(`${this.baseUrl}/payments/setup-customer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(customerData),
    });

    return this.handleResponse<CustomerResponse>(response);
  }

  /**
   * Get Stripe customer information
   */
  async getCustomer(): Promise<CustomerResponse> {
    const response = await fetch(`${this.baseUrl}/payments/customer`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<CustomerResponse>(response);
  }

  /**
   * Update Stripe customer information
   */
  async updateCustomer(updateData: {
    email?: string;
    name?: string;
    phone?: string;
  }): Promise<CustomerResponse> {
    const response = await fetch(`${this.baseUrl}/payments/customer`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    return this.handleResponse<CustomerResponse>(response);
  }

  /**
   * Setup and save a payment method
   */
  async setupPaymentMethod(data: SetupPaymentMethodRequest): Promise<SetupPaymentMethodResponse> {
    const response = await fetch(`${this.baseUrl}/payments/setup-payment-method`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<SetupPaymentMethodResponse>(response);
  }

  /**
   * Get all payment methods for the authenticated tenant
   */
  async getPaymentMethods(): Promise<{ success: boolean; paymentMethods: PaymentMethodResponse[]; count: number }> {
    const response = await fetch(`${this.baseUrl}/payments/payment-methods`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{ success: boolean; paymentMethods: PaymentMethodResponse[]; count: number }>(response);
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<{ success: boolean; message: string; paymentMethodId: string }> {
    const response = await fetch(`${this.baseUrl}/payments/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{ success: boolean; message: string; paymentMethodId: string }>(response);
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<{ success: boolean; message: string; paymentMethodId: string }> {
    const response = await fetch(`${this.baseUrl}/payments/payment-methods/${paymentMethodId}/default`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{ success: boolean; message: string; paymentMethodId: string }>(response);
  }

  /**
   * Create a Stripe Setup Intent for secure payment method collection
   * This is used when you want to collect payment method details without immediate payment
   */
  async createSetupIntent(): Promise<{ clientSecret: string }> {
    const response = await fetch(`${this.baseUrl}/payments/create-setup-intent`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{ clientSecret: string }>(response);
  }

  /**
   * Validate if the current tenant has a Stripe customer account
   */
  async hasStripeCustomer(): Promise<boolean> {
    try {
      await this.getCustomer();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the default payment method
   */
  async getDefaultPaymentMethod(): Promise<PaymentMethodResponse | null> {
    try {
      const { paymentMethods } = await this.getPaymentMethods();
      return paymentMethods.find(pm => pm.isDefault) || null;
    } catch (error) {
      console.error('Error getting default payment method:', error);
      return null;
    }
  }

  /**
   * Check if tenant has any payment methods
   */
  async hasPaymentMethods(): Promise<boolean> {
    try {
      const { count } = await this.getPaymentMethods();
      return count > 0;
    } catch (error) {
      console.error('Error checking payment methods:', error);
      return false;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;